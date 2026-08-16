import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";

export default function Home() {
  const { words, letters, loading } = useData();

  return (
    <div className="app-shell home">
      <div className="home-hero">
        <h1 className="home-title">GeLearner</h1>
        <p className="home-subtitle">Учим грузинский алфавит</p>
        {!loading && (
          <p className="home-stats">
            {letters.length} букв · {words.length} слов
          </p>
        )}
      </div>

      <div className="home-modes">
        <Link to="/mode1" className="mode-card">
          <span className="mode-card-emoji">🔤</span>
          <span className="mode-card-title">Собери слово</span>
          <span className="mode-card-desc">
            Слово на грузинском — собери его по буквам из карточек
          </span>
        </Link>

        <Link to="/mode2" className="mode-card">
          <span className="mode-card-emoji">🎯</span>
          <span className="mode-card-title">Как читается буква</span>
          <span className="mode-card-desc">
            Выбери правильное чтение грузинской буквы
          </span>
        </Link>

        <Link to="/mode3" className="mode-card">
          <span className="mode-card-emoji">⌨️</span>
          <span className="mode-card-title">Напиши слово</span>
          <span className="mode-card-desc">
            Впиши, как слово читается по-русски
          </span>
        </Link>
      </div>
    </div>
  );
}
