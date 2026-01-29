'use client';

import { useEffect, useState, use, useRef } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { FiHeart, FiDownload, FiArrowLeft, FiImage, FiSmile, FiX, FiSend, FiRefreshCw as FiLoader, FiMaximize2, FiMinimize2, FiTrash2 } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Comment {
    id: number;
    content: string;
    mediaUrl: string | null;
    mediaType: string;
    user: {
        name: string;
        image: string | null;
    };
    createdAt: string;
}

interface Post {
    id: number;
    title: string | null;
    description: string | null;
    mediaUrl: string;
    mediaType: string;
    isLiked: boolean;
    createdAt: string;
    user: {
        name: string;
        image: string | null;
    };
    _count: {
        likes: number;
    };
    tags: { name: string }[];
}

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');

    const handleDeletePost = async () => {
        if (!window.confirm('Voulez-vous vraiment supprimer ce post ?')) return;
        try {
            await axios.delete(`/api/posts/${id}`);
            router.push('/');
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!window.confirm('Voulez-vous vraiment supprimer ce commentaire ?')) return;
        try {
            await axios.delete(`/api/comments/${commentId}`);
            setComments(comments.filter(c => c.id !== commentId));
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la suppression');
        }
    };
    const [loading, setLoading] = useState(true);
    const [likeCount, setLikeCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(false);

    // Initial dummy data for GIFs until we have a real key or backend proxy
    const [gifSearch, setGifSearch] = useState('');
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [gifs, setGifs] = useState<string[]>([]);
    const [loadingGifs, setLoadingGifs] = useState(false);

    // Media upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedGif, setSelectedGif] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchPostData();
    }, [id]);

    const fetchPostData = async () => {
        try {
            const [postRes, commentsRes] = await Promise.all([
                axios.get(`/api/posts/${id}`),
                axios.get(`/api/posts/${id}/comments`)
            ]);
            setPost(postRes.data);
            setLikeCount(postRes.data._count.likes);
            setIsLiked(postRes.data.isLiked);
            setComments(commentsRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleLike = async () => {
        if (!session || !post) return;
        if (isLikeLoading) return;

        const previousLiked = isLiked;
        const previousCount = likeCount;

        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
        setIsLikeLoading(true);

        try {
            const res = await axios.post(`/api/posts/${post.id}/like`);
            setIsLiked(res.data.liked);
        } catch (error) {
            console.error(error);
            setIsLiked(previousLiked);
            setLikeCount(previousCount);
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setSelectedGif(null);
            setShowGifPicker(false);
        }
    };

    const searchGifs = async () => {
        if (!gifSearch.trim()) return;
        setLoadingGifs(true);
        try {
            const res = await axios.get(`https://g.tenor.com/v1/search?q=${gifSearch}&key=LIVDSRZULELA&limit=8`);
            setGifs(res.data.results.map((r: any) => r.media[0].tinygif.url));
        } catch (e) {
            console.error("Tenor error", e);
            setGifs([
                'https://media.tenor.com/m4Vz2U2iJmUAAAAC/cat-vibe.gif',
                'https://media.tenor.com/84N3_F5yZsgAAAAC/excited-minions.gif'
            ]);
        } finally {
            setLoadingGifs(false);
        }
    };

    const selectGif = (url: string) => {
        setSelectedGif(url);
        setPreviewUrl(url);
        setSelectedFile(null);
        setShowGifPicker(false);
    }

    const clearMedia = () => {
        setSelectedFile(null);
        setSelectedGif(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    const submitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newComment.trim() && !selectedFile && !selectedGif) || !post) return;

        try {
            const formData = new FormData();
            formData.append('content', newComment);

            if (selectedFile) {
                formData.append('file', selectedFile);
            } else if (selectedGif) {
                formData.append('gifUrl', selectedGif);
            }

            const res = await axios.post(`/api/posts/${post.id}/comments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setComments([...comments, res.data]);
            setNewComment('');
            clearMedia();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDownload = async () => {
        if (!post) return;
        try {
            const response = await fetch(post.mediaUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = post.title || 'download';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error('Download failed', e);
        }
    };

    if (loading || status === 'loading') return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

    if (status === 'unauthenticated') {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Accès réservé</h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: '500px' }}>
                    Vous devez être connecté pour voir ce contenu.
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/login" className="btn btn-primary">Se connecter</Link>
                    <Link href="/register" className="btn btn-secondary">S'inscrire</Link>
                </div>
            </div>
        );
    }

    if (!post) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Post introuvable</div>;

    return (
        <div className="post-page-container">
            {/* Left: Media - Full Flexible Space */}
            <div className="post-page-media">
                <Link href="/" style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    zIndex: 10,
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    padding: '0.75rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                }}>
                    <FiArrowLeft size={24} />
                </Link>

                {post.mediaType === 'VIDEO' ? (
                    <video src={post.mediaUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                    <img src={post.mediaUrl} alt={post.title || 'Post'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
            </div>

            {/* Right: Info & Comments - Sidebar */}
            <div className="post-page-sidebar">
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', overflow: 'hidden' }}>
                            {post.user.image ? <img src={post.user.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : post.user.name[0]}
                        </div>
                        <div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{post.user.name}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{new Date(post.createdAt!).toLocaleDateString()}</div>
                        </div>
                    </div>

                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
                        {post.title || 'Sans titre'}
                    </h1>
                    {post.description && <p style={{ color: 'var(--foreground)', lineHeight: 1.5, marginBottom: '1rem' }}>{post.description}</p>}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button
                            onClick={toggleLike}
                            className="btn"
                            style={{ padding: '0.5rem 1rem', background: isLiked ? 'rgba(236, 72, 153, 0.1)' : 'rgba(0,0,0,0.05)', color: isLiked ? '#ec4899' : 'var(--foreground)', border: isLiked ? '1px solid #ec4899' : 'none' }}
                        >
                            <FiHeart style={{ fontSize: '1.25rem', fill: isLiked ? '#ec4899' : 'none', marginRight: '0.5rem' }} />
                            {likeCount}
                        </button>
                        <button onClick={handleDownload} className="btn" style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.05)' }}>
                            <FiDownload style={{ fontSize: '1.25rem' }} />
                        </button>
                        {session?.user?.isAdmin && (
                            <button onClick={handleDeletePost} className="btn" style={{ padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} title="Supprimer le post">
                                <FiTrash2 style={{ fontSize: '1.25rem' }} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Comments Scrollable Area */}
                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Commentaires ({comments.length})</h3>
                    {comments.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>Aucun commentaire pour le moment.</p>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, overflow: 'hidden' }}>
                                    {comment.user.image ? <img src={comment.user.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : comment.user.name[0].toUpperCase()}
                                </div>
                                <div style={{ background: 'rgba(25, 12, 62, 0.03)', padding: '0.75rem', borderRadius: '0 1rem 1rem 1rem', width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{comment.user.name}</div>
                                        {session?.user?.isAdmin && (
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                title="Supprimer le commentaire"
                                            >
                                                <FiTrash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    {comment.content && <div style={{ fontSize: '0.95rem', color: 'var(--foreground)', marginBottom: comment.mediaUrl ? '0.5rem' : 0 }}>{comment.content}</div>}
                                    {comment.mediaUrl && (
                                        comment.mediaType === 'VIDEO' ? (
                                            <video src={comment.mediaUrl} controls style={{ maxWidth: '200px', borderRadius: '0.5rem' }} />
                                        ) : (
                                            <img src={comment.mediaUrl} alt="Comment Media" style={{ maxWidth: '200px', borderRadius: '0.5rem' }} />
                                        )
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', background: 'var(--card-bg)', position: 'relative' }}>
                    {session ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {/* Previews */}
                            {previewUrl && (
                                <div style={{ position: 'relative', display: 'inline-block', width: 'fit-content' }}>
                                    <img src={previewUrl} alt="Selected" style={{ height: '80px', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }} />
                                    <button onClick={clearMedia} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                                        <FiX size={12} />
                                    </button>
                                </div>
                            )}

                            {/* GIF Picker */}
                            {showGifPicker && (
                                <div className="glass-panel" style={{ position: 'absolute', bottom: '100%', left: '1rem', right: '1rem', height: '300px', padding: '1rem', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 600 }}>Choisir un GIF</span>
                                        <button onClick={() => setShowGifPicker(false)}><FiX /></button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <input
                                            type="text"
                                            placeholder="Rechercher sur Tenor..."
                                            className="input-field"
                                            value={gifSearch}
                                            onChange={(e) => setGifSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && searchGifs()}
                                        />
                                        <button className="btn btn-primary" onClick={searchGifs}>Chercher</button>
                                    </div>
                                    <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        {loadingGifs ? <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'center' }}><FiLoader className="spin" /></div> :
                                            gifs.map((gif, i) => (
                                                <img
                                                    key={i}
                                                    src={gif}
                                                    style={{ width: '100%', cursor: 'pointer', borderRadius: '4px' }}
                                                    onClick={() => selectGif(gif)}
                                                />
                                            ))
                                        }
                                    </div>
                                </div>
                            )}

                            <form onSubmit={submitComment} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />

                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Ajouter une image"
                                    style={{ padding: '0.5rem', background: 'transparent' }}
                                >
                                    <FiImage size={20} />
                                </button>

                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setShowGifPicker(!showGifPicker)}
                                    title="Ajouter un GIF"
                                    style={{ padding: '0.5rem', background: 'transparent' }}
                                >
                                    <FiSmile size={20} />
                                </button>

                                <input
                                    type="text"
                                    placeholder="Votre message..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="input-field"
                                    style={{ padding: '0.75rem 1rem', flex: 1 }}
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ padding: '0.75rem 1.25rem' }}
                                    disabled={!newComment.trim() && !selectedFile && !selectedGif}
                                >
                                    <FiSend />
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Connectez-vous</Link> pour participer à la discussion.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
