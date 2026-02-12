import HeroCanvas from './HeroCanvas'

export default function Hero() {
    return (
        <section className="hero" id="home">
            <div className="hero-bg-glow" />
            <HeroCanvas />
            <div className="hero-content">
                <p className="hero-greeting">Hello, I&apos;m</p>
                <h1 className="hero-name">Abhay Raj</h1>
                <p className="hero-tagline">FOSS Developer · Open Source Enthusiast</p>
                <div className="hero-cta-group">
                    <a href="#projects" className="btn btn-primary">View Projects</a>
                    <a
                        href="https://github.com/abhay-byte/my-resume/releases/latest"
                        className="btn btn-outline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Download Resume ↗
                    </a>
                </div>
            </div>
        </section>
    )
}
