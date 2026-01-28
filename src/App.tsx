import { offersData } from "./data/offers";
import "./App.css";

function App() {
  // Date limite pour le bouton tulipes : 12 février 2026 à 23:59:59
  const tulipesExpirationDate = new Date("2026-02-12T23:59:59");
  const isTulipesAvailable = new Date() <= tulipesExpirationDate;

  return (
    <div className="app-container">
      <div className="gradient-bg">
        <div className="header-container">
          {/* Instagram Button */}
          <a
            href="https://www.instagram.com/bde.mmi.lannion/"
            target="_blank"
            className="button button-left"
          >
            <div className="icon-box">
              <img src="/instagram.svg" alt="Instagram" />
            </div>
            <div className="text-content">Instagram</div>
          </a>

          {/* Buttons Container */}
          <div className="buttons-container">
            {/* Adherent Button */}
            <a
              href="https://www.helloasso.com/associations/inter-asso/adhesions/adhesion-bde-mmi-2"
              target="_blank"
              className="button button-right"
            >
              <div className="text-content">Devenir adhérent</div>
            </a>

            {/* Fleurs Button - visible jusqu'au 12 février */}
            {isTulipesAvailable && (
              <a href="/tulipes" className="button button-pink">
                <div className="text-content">Achat des fleurs</div>
              </a>
            )}
          </div>

          {/* Explanation Container */}
          <div className="explanation-container">
            <div className="logo-container">
              <div className="mmilogo">
                <img src="/logo.svg" alt="MMI Spark Logo" />
              </div>
              <div className="logo">
                <img src="/sparkpass.svg" alt="SparkPass" />
              </div>
            </div>
            <p>
              En tant qu'adhérent du BDE MMI de Lannion, tu bénéficies de
              nombreuses réductions chez les commerces partenaires grâce à ta
              carte SparkPass :
            </p>
          </div>

          {/* Promo Container */}
          <div className="promo-container">
            <p className="promo-text">
              Tu n’as pas encore ta carte ? <br />
              Deviens adhérent du BDE MMI Lannion !
            </p>
            <img
              src="/sparkpassexample.png"
              alt="SparkPass Example"
              className="promo-image"
            />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <img src="/search.svg" alt="Search" className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Rechercher un commerce..."
        />
      </div>

      {/* Offers Container */}
      <div className="offers-container">
        {offersData.map((offer, index) => (
          <div key={index} className="offer-card">
            <div className="offer-image-container">
              <img
                src={offer.image}
                alt={offer.title}
                className="offer-image"
              />
            </div>
            <div className="offer-details">
              <div className="offer-tags">
                {offer.tags.map((tag) => (
                  <span key={tag} className="offer-tag">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="offer-text">
                <h3 className="offer-title">{offer.title}</h3>
                <p className="offer-subtitle">{offer.subtitle}</p>
              </div>
              <a href={offer.link} target="_blank" className="offer-button">
                <span className="offer-button-text">En profiter</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-motif">
          <img src="/motif.png" alt="" />
        </div>
        <div className="footer-content">
          <div className="footer-links">
            <p>&copy; 2026 BDE MMI Lannion</p>
            <a
              href="https://www.instagram.com/bde.mmi.lannion/"
              target="_blank"
              className="footer-link"
            >
              Instagram
            </a>
            <a
              href="https://www.helloasso.com/associations/inter-asso/adhesions/adhesion-bde-mmi"
              target="_blank"
              className="footer-link"
            >
              Devenir adhérent
            </a>
            <a
              href="https://inter-asso.fr/"
              target="_blank"
              className="footer-link"
            >
              Inter-asso
            </a>
            <a href="mailto:bdemmi@inter-asso.fr" className="footer-link">
              Contact
            </a>
          </div>
          <div className="footer-disclaimer-box">
            <p className="footer-disclaimer">
              Réservé aux étudiants de l'IUT adhérents.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
