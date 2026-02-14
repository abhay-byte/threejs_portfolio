import { useEffect, useRef, useState } from 'react'

const GitHubIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
)

const ExternalIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
)

const projects = [
    {
        iconImg: '/images/fluxlinux-icon.webp',
        iconBg: 'linear-gradient(135deg, #4CAF50, #2196F3)',
        title: 'FluxLinux',
        description: 'Run full Linux desktop environments on Android with GPU acceleration and complete development stacks. Published on F-Droid.',
        tags: ['Android', 'Kotlin', 'Linux', 'Shell'],
        github: 'https://github.com/abhay-byte/fluxlinux',
        live: 'https://f-droid.org/packages/com.ivarna.fluxlinux',
        video: '/videos/fluxlinux.mp4',
        screenshot: '/images/fluxlinux-screenshot.png'
    },
    {
        iconImg: '/images/finalbenchmark-icon.png',
        iconBg: 'linear-gradient(135deg, #FF6B6B, #fabd2f)',
        title: 'FinalBenchmark 2',
        description: 'Comprehensive CPU benchmarking app with 10+ tests, thermal management, and detailed performance analytics. Published on F-Droid.',
        tags: ['Android', 'Kotlin', 'Performance'],
        github: 'https://github.com/abhay-byte/finalbenchmark-platform',
        live: 'https://f-droid.org/packages/com.ivarna.finalbenchmark2',
        screenshot: '/images/finalbenchmark-screenshot.png'
    },
    {
        iconImg: '/images/deviceinsight-icon.webp',
        iconBg: 'linear-gradient(135deg, #667eea, #764ba2)',
        title: 'DeviceInsight',
        description: 'Premium system monitoring with glassmorphism UI, real-time analytics, and kernel-level performance metrics.',
        tags: ['Android', 'Kotlin', 'UI/UX'],
        github: 'https://github.com/abhay-byte/deviceinsight',
        live: null,
        screenshot: '/images/deviceinsight-screenshot.png'
    },
    {
        iconImg: '/images/clinico-icon.png',
        iconBg: 'linear-gradient(135deg, #00C7B7, #4CAF50)',
        title: 'Clinico',
        description: 'AI-powered healthcare platform with 24/7 AI companion, telehealth, and hyperlocal clinic discovery. Full-stack with React + Node.js.',
        tags: ['React', 'Node.js', 'AI', 'Full Stack'],
        github: 'https://github.com/abhay-byte/minor-project-gtbit',
        live: 'https://clinicofrontend.onrender.com/',
        screenshot: '/images/clinico-screenshot.png'
    },
    {
        iconImg: '/images/mkm-icon.png',
        iconBg: 'linear-gradient(135deg, #fabd2f, #FF6B6B)',
        title: 'MKM',
        description: 'Minimal Kernel Manager for persistent swap management with Shizuku support. Smart memory optimization for Android.',
        tags: ['Android', 'Kotlin', 'Kernel'],
        github: 'https://github.com/abhay-byte/mkm',
        live: null,
        screenshot: '/images/mkm-screenshot.png'
    },
    {
        iconImg: '/images/fantasy-racing-icon.png',
        iconBg: 'linear-gradient(135deg, #f093fb, #f5576c)',
        title: 'Fantasy Racing',
        description: 'High-speed futuristic racing game with diverse planets, strategic challenges, and immersive gameplay built in Unity.',
        tags: ['Unity', 'C#', 'Game Dev'],
        github: 'https://github.com/abhay-byte/planet-racing',
        live: null,
        video: '/1.mp4',
        screenshot: '/images/fantasy-racing.png'
    },
    {
        iconImg: '/images/xirsia-icon.png',
        iconBg: 'linear-gradient(135deg, #a8edea, #fed6e3)',
        title: 'Story of Xirsia',
        description: '2D Role Playing Game set in the Medieval age with a massive 25km² open world of Xirsia Isle to explore.',
        tags: ['Unity', 'C#', 'RPG', 'Game Dev'],
        github: 'https://github.com/abhay-byte/Saiko-no-senshi-0.1v',
        live: 'https://hind-dev.web.app/#/',
        video: '/videos/xirsia.mp4',
        screenshot: null
    },
    {
        icon: '👻',
        iconBg: 'linear-gradient(135deg, #434343, #000000)',
        title: 'Whispers in the Mist',
        description: "Horror game set in St. Xavier's Boarding School in Ooty during Valentine's Day with mysterious occurrences.",
        tags: ['Unity', 'C#', 'Horror', 'Game Dev'],
        github: 'https://github.com/abhay-byte/valentines-day-unity',
        live: null,
        video: '/videos/whispers1.mp4',
        screenshot: null
    },
    {
        iconImg: '/images/portfolio-icon.ico',
        iconBg: 'linear-gradient(135deg, #667eea, #764ba2)',
        title: 'WebGL Website',
        description: 'Interactive website built with WebGL for stunning 3D graphics and animations showcasing creative web development.',
        tags: ['WebGL', 'Three.js', 'JavaScript'],
        github: 'https://github.com/abhay-byte/webgl-website',
        live: 'https://abhay-raj.web.app/',
        screenshot: '/images/webgl-screenshot.png'
    },
    {
        icon: '📈',
        iconBg: 'linear-gradient(135deg, #FF4B4B, #fabd2f)',
        title: 'Investment Growth Prediction',
        description: 'AI-powered investment growth predictor with monthly contribution simulations, CSV reports, and graphical insights.',
        tags: ['Python', 'Streamlit', 'AI'],
        github: 'https://github.com/abhay-byte/AI_WRAPPER_PROJECTS',
        live: 'https://aiwrapper.streamlit.app',
        screenshot: '/images/investment-growth-screenshot.png'
    }
]

export default function Projects() {
    const sectionRef = useRef()
    const [visibleCards, setVisibleCards] = useState(new Set())

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(e => {
                    if (e.isIntersecting) e.target.classList.add('visible')
                })
            },
            { threshold: 0.05 }
        )
        const reveals = sectionRef.current?.querySelectorAll('.reveal')
        reveals?.forEach(el => observer.observe(el))
        return () => reveals?.forEach(el => observer.unobserve(el))
    }, [])

    // Lazy-render cards: only mount cards near the viewport
    useEffect(() => {
        const cardObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        const idx = Number(e.target.dataset.idx)
                        setVisibleCards(prev => new Set([...prev, idx]))
                    }
                })
            },
            { rootMargin: '200px 0px' }
        )
        const placeholders = sectionRef.current?.querySelectorAll('.project-card-placeholder')
        placeholders?.forEach(el => cardObserver.observe(el))
        return () => placeholders?.forEach(el => cardObserver.unobserve(el))
    }, [])

    return (
        <section className="section" id="projects" ref={sectionRef}>
            <div className="section-header reveal">
                <p className="section-label">Work</p>
                <h2 className="section-title">Featured Projects</h2>
                <div className="section-divider" />
            </div>

            <div className="projects-grid">
                {projects.map((project, i) => (
                    <div
                        className={`project-card reveal project-card-placeholder`}
                        key={i}
                        data-idx={i}
                        style={{ transitionDelay: `${Math.min(i, 3) * 0.08}s`, minHeight: '280px' }}
                    >
                        {visibleCards.has(i) && (
                            <>
                                {(project.video || project.screenshot) && (
                                    <div className="project-screenshot">
                                        {project.video ? (
                                            <video src={project.video} autoPlay loop muted playsInline />
                                        ) : (
                                            <img src={project.screenshot} alt={`${project.title} screenshot`} loading="lazy" />
                                        )}
                                    </div>
                                )}
                                <div className="project-card-header">
                                    <div className="project-icon" style={{ background: project.iconBg }}>
                                        {project.iconImg ? (
                                            <img src={project.iconImg} alt={project.title} />
                                        ) : (
                                            project.icon
                                        )}
                                    </div>
                                    <h3>{project.title}</h3>
                                </div>
                                <div className="project-card-body">
                                    <p>{project.description}</p>
                                    <div className="project-tags">
                                        {project.tags.map((tag, j) => (
                                            <span className="project-tag" key={j}>{tag}</span>
                                        ))}
                                    </div>
                                    <div className="project-links">
                                        <a href={project.github} className="project-link" target="_blank" rel="noopener noreferrer">
                                            <GitHubIcon /> GitHub
                                        </a>
                                        {project.live && (
                                            <a href={project.live} className="project-link" target="_blank" rel="noopener noreferrer">
                                                <ExternalIcon /> Live Demo
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </section>
    )
}
