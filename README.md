# Korean Interactive Story Engine

A web-based visual novel engine specifically designed for **Intermediate to Advanced (B1-C1) Korean learners**. This tool combines immersive storytelling with active language practice.

## 🌟 Features

*   **Interactive Branching Story:** Choice-based gameplay where your decisions directly impact the plot and lead to different outcomes.
*   **Targeted Level:** Content is tailored for learners who want to move beyond the basics into complex grammar and natural vocabulary.
*   **Multi-Character Paths:** Four unique characters, each with their own story chapters loaded via JSON.
*   **Analysis Mode:** A "Sticker" system that allows you to click on Korean text to see draggable grammar and vocabulary cards.
*   **Smart Quiz System:**
    *   **Context-Based:** Generates questions only from the words/grammar you've actually encountered in your current chapter.
    *   **Multiple Modes:** Choose between vocabulary, grammar, or mixed practice.
    *   **Interactive:** Includes both Multiple Choice and Korean typing input.
*   **Bilingual Support:** Full UI and database localization for both English and Russian speakers.
*   **Progress Tracking:** An interactive radial map that unlocks chapters and saves your history to `localStorage`.
*   **Author Mode:** A built-in toggle for developers to bypass restrictions and test all story branches easily.

## 🛠 Tech Stack

*   **Logic:** Vanilla JavaScript (ES6+)
*   **Data:** JSON (Modular files for stories and grammar)
*   **Styling:** CSS3 (with dynamic themes and mobile-responsive layout)
*   **Graphics:** SVG for dynamic map path rendering
*   **Storage:** Browser LocalStorage API

## 🚀 How to use

1.  **Run the project** through a local server (like Live Server in VS Code).
2.  **Select a character** and start your journey.
3.  **Choose your language** (EN/RU).
4.  **Toggle "Analysis"** to study the text or open **"Quiz"** to test your knowledge of the current chapter.
