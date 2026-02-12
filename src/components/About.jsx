import { useEffect, useRef } from 'react'

const skills = [
    'Android (Kotlin)', 'React', 'Three.js', 'Node.js', 'Flutter',
    'Unity / C#', 'Python', 'Linux / Shell', 'WebGL', 'Firebase',
    'Jetpack Compose', 'Git', 'Figma', 'GSAP', 'Docker'
]

const stats = [
    { number: '10+', label: 'Projects' },
    { number: '5+', label: 'Open Source' },
    { number: '2', label: 'F-Droid Apps' },
    { number: '∞', label: 'Curiosity' },
]

export default function About() {
    const sectionRef = useRef()

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(e => {
                    if (e.isIntersecting) e.target.classList.add('visible')
                })
            },
            { threshold: 0.15 }
        )
        const reveals = sectionRef.current?.querySelectorAll('.reveal')
        reveals?.forEach(el => observer.observe(el))
        return () => reveals?.forEach(el => observer.unobserve(el))
    }, [])

    return (
        <section className="section" id="about" ref={sectionRef}>
            <div className="section-header reveal">
                <p className="section-label">About</p>
                <h2 className="section-title">Who I Am</h2>
                <div className="section-divider" />
            </div>

            <div className="about-grid">
                <div className="about-text reveal">
                    <p>
                        I&apos;m <strong>Abhay Raj</strong>, an open source enthusiast and <strong>FOSS developer</strong>,
                        passionate about community-driven development and making software accessible for everyone.
                    </p>
                    <p>
                        From crafting immersive game worlds in Unity to building powerful Android tools like
                        <strong> FluxLinux</strong> (GPU-accelerated Linux on mobile) and <strong>FinalBenchmark</strong>
                        (comprehensive CPU benchmarking), I love pushing the boundaries of what&apos;s possible on every platform.
                    </p>
                    <p>
                        I believe in building in public, contributing to the open source ecosystem, and creating tools that
                        empower developers worldwide.
                    </p>

                    <div className="about-stats">
                        {stats.map((s, i) => (
                            <div className="stat-card" key={i}>
                                <div className="stat-number">{s.number}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="reveal">
                    <p className="section-label" style={{ marginBottom: 16 }}>Tech Stack</p>
                    <div className="skills-grid">
                        {skills.map((skill, i) => (
                            <span className="skill-tag" key={i}>{skill}</span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
