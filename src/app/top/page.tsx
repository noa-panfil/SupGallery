'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import PostCard from '../components/PostCard';
import { FiTrendingUp } from 'react-icons/fi';

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
    };
    _count: {
        comments: number;
        likes: number;
    };
    tags: { name: string }[];
}

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function TopPage() {
    const { data: session, status } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchPosts();
        } else if (status === 'unauthenticated') {
            setLoading(false);
        }
    }, [status]);

    const fetchPosts = async () => {
        try {
            const res = await axios.get('/api/posts?sort=top');
            setPosts(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || status === 'loading') return <div className="container" style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>Chargement du classement...</div>;

    if (status === 'unauthenticated') {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Connexion requise</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Connectez-vous pour voir le classement des meilleures publications.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link href="/login" className="btn btn-primary">Se connecter</Link>
                        <Link href="/register" className="btn btn-secondary">S'inscrire</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '1280px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <FiTrendingUp /> Top Likes
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Les publications les plus populaires de la galerie.</p>
            </div>

            {posts.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                    <p>Aucune publication pour le moment.</p>
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
