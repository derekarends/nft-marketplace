import 'bootstrap/dist/css/bootstrap.css'
import '../styles/globals.css'
import Link from 'next/link'

function Marketplace({ Component, pageProps }) {
  return (
    <div className="container">
      <h1>Cool Art Marketplace</h1>
      <nav className="nav">
        <Link href="/">
          <a className="nav-link">
            Home
          </a>
        </Link>
        <Link href="/dashboard">
          <a className="nav-link">
            Dashboard
          </a>
        </Link>
        <Link href="/my-assets">
          <a className="nav-link">
            My Digital Assets
          </a>
        </Link>
        <Link href="/create-asset">
          <a className="nav-link">
            Sell Digital Asset
          </a>
        </Link>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

export default Marketplace;
