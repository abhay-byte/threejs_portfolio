import { useState, useEffect } from 'react'

export default function Navbar({ visible }) {
    const [hidden, setHidden] = useState(false)
    const [lastScroll, setLastScroll] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const current = window.scrollY
            setHidden(current > lastScroll && current > 100)
            setLastScroll(current)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [lastScroll])

    if (!visible) return null

    return (
        <nav className={`navbar ${hidden ? 'hidden' : ''}`}>
            <a href="#home" className="nav-logo">AR.</a>
            <ul className="nav-links">
                <li><a href="#about">About</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    )
}
