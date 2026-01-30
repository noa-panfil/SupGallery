'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import PostCard from './components/PostCard';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Post {
    id: number;
    title: string | null;
    description: string | null;
    mediaUrl: string;
    mediaType: string;
    isLiked: boolean;
    user: {
        name: string;
        image: string | null;
        badges?: string[];
    };
    _count: {
        comments: number;
        likes: number;
    };
    tags: { name: string }[];
}

export default function Home() {
    const { data: session, status } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchPosts();
            const interval = setInterval(() => {
                fetchPosts();
            }, 5000);
            return () => clearInterval(interval);
        } else if (status === 'unauthenticated') {
            setLoading(false);
        }
    }, [status]);

    const fetchPosts = async () => {
        try {
            const res = await axios.get('/api/posts');
            setPosts(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || status === 'loading') return (
        <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>
            <div className="spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
            <div style={{ color: 'var(--text-muted)' }}>Chargement de la galerie...</div>
        </div>
    );

    if (status === 'unauthenticated') {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
                <div className="glass-panel" style={{ maxWidth: '600px', padding: '3rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(to right, #3D2683, #4338ca)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Bienvenue sur SupGallery
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                        La plateforme exclusive de partage pour les étudiants de SUPINFO.
                        Connectez-vous pour découvrir les créations de la communauté et partager les vôtres.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link href="/login" className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>
                            Se connecter
                        </Link>
                        <Link href="/register" className="btn btn-secondary" style={{ padding: '0.8rem 2rem' }}>
                            Créer un compte
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '1280px' }}>
            {posts.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Rien à voir ici</h2>
                    <p>Soyez le premier à publier quelque chose !</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '2rem'
                }}>
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
}
