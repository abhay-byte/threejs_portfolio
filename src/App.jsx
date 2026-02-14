import { useState } from 'react'
import IntroScene from './components/IntroScene'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import FantasyRacing from './components/FantasyRacing'
import Contact from './components/Contact'
import './index.css'

export default function App() {
  const [introComplete, setIntroComplete] = useState(false)

  return (
    <>
      <Navbar visible={introComplete} />
      <IntroScene onComplete={() => setIntroComplete(true)} />
      <main>
        <Hero />
        <About />
        <Projects />
        <FantasyRacing />
        <Contact />
      </main>
      <footer className="footer">
        <p>
          Designed & Built by <a href="https://github.com/abhay-byte">Abhay Raj</a> · {new Date().getFullYear()}
        </p>
      </footer>
    </>
  )
}
