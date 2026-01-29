'use client';

import { useState } from 'react';
import axios from 'axios';
import { FiMessageSquare, FiDownload, FiShare2, FiHeart, FiPlay, FiTrash2 } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Comment {
    id: number;
    content: string;
    user: {
        name: string;
        image: string | null;
    };
    createdAt: string;
}

interface PostProps {
    post: {
        id: number;
        title: string | null;
        description: string | null;
        mediaUrl: string;
        mediaType: string;
        isLiked: boolean;
        user: {
            name: string;
            image: string | null;
        };
        _count: {
            comments: number;
            likes: number;
        };
        created_at?: string;
        tags: { name: string }[];
    }
}

export default function PostCard({ post: initialPost }: PostProps) {
    const { data: session } = useSession();
    const [post, setPost] = useState(initialPost);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentCount, setCommentCount] = useState(initialPost._count.comments);
    const [likeCount, setLikeCount] = useState(initialPost._count.likes);
    const [isLiked, setIsLiked] = useState(initialPost.isLiked);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm('Voulez-vous vraiment supprimer ce post ?')) return;
        try {
            await axios.delete(`/api/posts/${post.id}`);
            setIsDeleted(true);
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
            setCommentCount(prev => prev - 1);
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la suppression');
        }
    };

    const toggleComments = async () => {
        if (!showComments) {
            setLoadingComments(true);
            try {
                const res = await axios.get(`/api/posts/${post.id}/comments`);
                setComments(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingComments(false);
            }
        }
        setShowComments(!showComments);
    };

    const submitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await axios.post(`/api/posts/${post.id}/comments`, { content: newComment });
            setComments([...comments, res.data]);
            setNewComment('');
            setCommentCount(commentCount + 1);
        } catch (error) {
            console.error(error);
        }
    };

    const toggleLike = async () => {
        if (!session) return;
        if (isLikeLoading) return;

        // Optimistic update
        const previousLiked = isLiked;
        const previousCount = likeCount;

        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
        setIsLikeLoading(true);

        try {
            const res = await axios.post(`/api/posts/${post.id}/like`);
            // Sync with server response if needed, but simple toggle should match
            setIsLiked(res.data.liked);
            // Adjust count if optimistic update was wrong (rare)
        } catch (error) {
            // Revert on error
            console.error(error);
            setIsLiked(previousLiked);
            setLikeCount(previousCount);
        } finally {
            setIsLikeLoading(false);
        }
    }

    const handleDownload = async () => {
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

    if (isDeleted) return null;

    return (
        <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
            {/* Header */}
            <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
                    {post.user.image ? <img src={post.user.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : post.user.name[0]}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.2, color: 'var(--foreground)' }}>
                        {post.title || 'Sans titre'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        par {post.user.name}
                    </div>
                </div>

                {session?.user?.isAdmin && (
                    <button
                        onClick={handleDelete}
                        className="btn"
                        style={{ padding: '0.5rem', background: 'transparent', color: '#ff4d4d', marginLeft: 'auto' }}
                        title="Supprimer le post"
                    >
                        <FiTrash2 size={20} />
                    </button>
                )}
            </div>

            {/* Media */}
            <Link href={`/posts/${post.id}`} style={{ display: 'block', cursor: 'pointer' }}>
                <div style={{ position: 'relative', width: '100%', background: 'black', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {post.mediaType === 'VIDEO' ? (
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <video src={post.mediaUrl} controls={false} style={{ maxWidth: '100%', maxHeight: '400px' }} />
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'rgba(61, 38, 131, 0.8)', // #3D2683 with opacity
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                zIndex: 10
                            }}>
                                <FiPlay size={24} style={{ marginLeft: '4px' }} />
                            </div>
                        </div>
                    ) : (
                        <img src={post.mediaUrl} alt={post.title || 'Post'} style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                    )}
                </div>
            </Link>

            {/* Actions */}
            <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={toggleLike}
                            className="btn"
                            style={{ padding: '0.5rem', background: 'transparent', color: isLiked ? '#ec4899' : 'var(--foreground)', cursor: session ? 'pointer' : 'default' }}
                            title={session ? 'J\'aime' : 'Connectez-vous pour aimer'}
                        >
                            <FiHeart style={{ fontSize: '1.5rem', fill: isLiked ? '#ec4899' : 'none' }} />
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: 'var(--foreground)' }}>{likeCount}</span>
                        </button>
                        <button onClick={toggleComments} className="btn" style={{ padding: '0.5rem', background: 'transparent', color: 'var(--foreground)' }}>
                            <FiMessageSquare style={{ fontSize: '1.5rem' }} />
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem' }}>{commentCount}</span>
                        </button>
                        <button onClick={() => { }} className="btn" style={{ padding: '0.5rem', background: 'transparent', color: 'var(--foreground)' }}>
                            <FiShare2 style={{ fontSize: '1.5rem' }} />
                        </button>
                    </div>
                    <button onClick={handleDownload} className="btn" style={{ padding: '0.5rem', background: 'rgba(25, 12, 62, 0.05)' }}>
                        <FiDownload />
                    </button>
                </div>

                {post.description && (
                    <p style={{ marginBottom: '1rem', lineHeight: '1.5' }}>
                        <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>{post.user.name}</span>
                        {post.description}
                    </p>
                )}

                {post.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                        {post.tags.map(tag => (
                            <span key={tag.name} style={{ fontSize: '0.85rem', color: 'var(--accent)', background: 'rgba(139, 92, 246, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                #{tag.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Comments Section */}
                {showComments && (
                    <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                        {loadingComments ? (
                            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>Chargement des commentaires...</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                                {comments.map(comment => (
                                    <div key={comment.id} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem', alignItems: 'flex-start' }}>
                                        <div style={{ minWidth: '32px', width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
                                            {comment.user.image ? (
                                                <img src={comment.user.image} alt={comment.user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                comment.user.name[0].toUpperCase()
                                            )}
                                        </div>
                                        <div style={{ background: 'rgba(25, 12, 62, 0.03)', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', width: '100%' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>{comment.user.name}</span>
                                                {session?.user?.isAdmin && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '2px' }}
                                                        title="Supprimer le commentaire"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <span style={{ color: 'var(--foreground)' }}>{comment.content}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {session && (
                            <form onSubmit={submitComment} style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    placeholder="Ajouter un commentaire..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="input-field"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                />
                                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Envoyer</button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
