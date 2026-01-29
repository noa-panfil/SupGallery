'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { FiUploadCloud, FiLogOut, FiUser, FiGrid, FiTrendingUp } from 'react-icons/fi';

export default function Navbar() {
    const { data: session } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="navbar-container glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <Link href="/" className="navbar-brand">
                    SupGallery
                </Link>
                <Link href="/top" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <FiTrendingUp size={18} /> <span className="hide-on-mobile">Top Likes</span>
                </Link>
            </div>

            <div className="navbar-actions">
                {session ? (
                    <>
                        <Link href="/upload" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                            <FiUploadCloud size={18} style={{ marginRight: '0.5rem' }} /> <span className="hide-on-mobile">Publier</span>
                        </Link>
                        {session.user?.isAdmin && (
                            <Link href="/admin" style={{ color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiGrid size={20} /> <span className="hide-on-mobile">Admin</span>
                            </Link>
                        )}
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--foreground)', padding: 0, display: 'flex' }}>
                                {session.user?.image ? (
                                    <img src={session.user.image} alt="User" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                                ) : (
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FiUser size={20} />
                                    </div>
                                )}
                            </button>
                            {isMenuOpen && (
                                <div className="glass-panel" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', minWidth: '180px', flexDirection: 'column', display: 'flex', padding: '0.5rem', gap: '0.5rem', zIndex: 100 }}>
                                    <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {session.user?.name}
                                    </div>
                                    <Link href="/profile" onClick={() => setIsMenuOpen(false)} style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
                                        <FiUser /> Mon Profil
                                    </Link>
                                    <button onClick={() => signOut()} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', textAlign: 'left', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                                        <FiLogOut /> Déconnexion
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <Link href="/login" style={{ color: 'var(--foreground)', fontWeight: 500 }}>Connexion</Link>
                        <Link href="/register" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                            <span className="hide-on-mobile">Inscription</span>
                            <span style={{ display: 'none' }} className="show-on-mobile">Inscr.</span>
                            {/* Assuming show-on-mobile is not defined, just hiding text on small screens might be enough */}
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
