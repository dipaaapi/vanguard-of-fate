import { t, getLang } from "./i18n.js";
import { Sound } from "./audio.js";

// ==================== ACT I PROLOGUE CINEMATIC ====================
// Atmospheric story prologue bago magising ang player sa Act II (Barracks Sanctuary).
// May audio stings, cinematic banner visual, typewriter / fading narrative beats, at controls.

const SLIDES = [
  {
    banner: "assets/banner/act-1.jpeg",
    title: {
      en: "Act I · The Golden Dominion of Aethelgard",
      fil: "Act I · Ang Gintong Panahon ng Aethelgard"
    },
    subtitle: {
      en: "Blessed by Astraea, United by the Four Celestial Gateways",
      fil: "Pinagpala ni Astraea, Pinag-isa ng Apat na Celestial Gateways"
    },
    paragraphs: {
      en: [
        "Long before the skies bled amethyst and obsidian, the continent of Aethelgard flourished under the radiant benediction of Astraea.",
        "At the heart of the realm stood the Imperial Citadel, guarded by four ancient Celestial Warp Gateways. For generations, absolute peace and balance reigned over the land."
      ],
      fil: [
        "Bago pa man naging kulay amatista at obsidiyano ang kalangitan, ang kontinente ng Aethelgard ay masaganang namukadkad sa ilalim ng maningning na basbas ni Astraea.",
        "Sa puso ng kaharian ay nakatindig ang Imperial Citadel, pinag-uugnay ng apat na sinaunang Celestial Warp Gateways. Sa loob ng maraming salinlahi, nanatili ang kapayapaan at kasaganaan."
      ]
    },
    sound: "thunder"
  },
  {
    banner: "assets/banner/act-1.jpeg",
    title: {
      en: "The Eclipse of the Abyss & Void Miasma",
      fil: "Ang Eklipse ng Kalaliman at ang Void Miasma"
    },
    subtitle: {
      en: "The Awakening of Demon Lord Satan",
      fil: "Ang Pagbangon ng Demon Lord na si Satan"
    },
    paragraphs: {
      en: [
        "During the fateful Eclipse of the Abyss, deep subterranean seals shattered, releasing Demon Lord Satan into the world.",
        "The archdemon exhaled the suffocating Void Miasma—withering forests, transforming wildlife into horrific nocturnal abominations, and unleashing the dread Seven Anomaly Blights upon mortals."
      ],
      fil: [
        "Sa paghahanay ng mga tala sa Eklipse ng Kalaliman, nawasak ang mga sinaunang selyo at nagising ang Demon Lord na si Satan mula sa kadiliman.",
        "Ibinuga niya ang nakalalasong Void Miasma—sumakal sa mga gubat, nagbago sa mga hayop upang maging mababangis na halimaw, at nagdala ng Pitong Sumpa (Seven Anomaly Blights) sa sangkatauhan."
      ]
    },
    sound: "darkness"
  },
  {
    banner: "assets/banner/act-2.jpg",
    title: {
      en: "The Royal Covenant & The Earthbound Summons",
      fil: "Ang Maharlikang Ritwal at ang Pagtawag mula sa Daigdig"
    },
    subtitle: {
      en: "Resolute Souls Drawn Across Dimensional Rifts",
      fil: "Mga Matatapang na Kaluluwa Mula sa Daigdig"
    },
    paragraphs: {
      en: [
        "Knowing mortal steel could no longer stem the demonic tide, the Crown Heir and the Magic & Research Corps enacted a forbidden rite: to reach across dimensional firmaments to Earth.",
        "As celestial runes ignited and the Royal Arcane Core roared to life, your soul was drawn across the veil of reality to lead the Grand Slaying Corps..."
      ],
      fil: [
        "Batid ng Kaharian na hindi na sapat ang karaniwang bakal, pinagtibay ng Maharlikang Tagapagmana ang isang ipinagbabawal na ritwal: ang tawirin ang mga dimensyon patungong Daigdig (Earth).",
        "Sa pag-ikot ng mga makalangit na glyph at pagputok ng liwanag mula sa Arcane Core, ang iyong kaluluwa ay tumawid sa kabilang daigdig upang maging pinuno ng Grand Slaying Corps..."
      ]
    },
    sound: "holy"
  }
];

export class PrologueScene {
  constructor(root, onComplete) {
    this.root = root;
    this.onComplete = onComplete;
    this.currentSlide = 0;
    this.heroName = "";
    this.open = false;

    this.bannerEl = root.querySelector("#prologueBanner");
    this.titleEl = root.querySelector("#prologueTitle");
    this.subEl = root.querySelector("#prologueSub");
    this.textEl = root.querySelector("#prologueText");
    this.dotsEl = root.querySelector("#prologueDots");
    this.nextBtn = root.querySelector("#prologueNext");
    this.skipBtn = root.querySelector("#prologueSkip");

    this.nextBtn.addEventListener("click", () => this.next());
    this.skipBtn.addEventListener("click", () => this.finish());
  }

  start(heroName = "") {
    this.heroName = heroName || (getLang() === "fil" ? "Bayani" : "Champion");
    this.currentSlide = 0;
    this.open = true;
    this.root.classList.add("active");
    this.root.focus();
    Sound.init();
    this.render();
  }

  render() {
    const lang = getLang() === "fil" ? "fil" : "en";
    const slide = SLIDES[this.currentSlide];

    if (this.bannerEl) {
      this.bannerEl.src = slide.banner;
      this.bannerEl.alt = slide.title[lang];
    }
    if (this.titleEl) this.titleEl.textContent = slide.title[lang];
    if (this.subEl) this.subEl.textContent = slide.subtitle[lang];

    if (this.textEl) {
      this.textEl.innerHTML = "";
      slide.paragraphs[lang].forEach((pText) => {
        const p = document.createElement("p");
        // Kung huling slide, i-highlight ang heroName
        if (this.currentSlide === SLIDES.length - 1 && this.heroName) {
          pText = pText.replace("your soul", `<b class="c-gold">${this.heroName}</b>'s soul`);
          pText = pText.replace("ang iyong kaluluwa", `ang kaluluwa ni <b class="c-gold">${this.heroName}</b>`);
        }
        p.innerHTML = pText;
        this.textEl.appendChild(p);
      });
    }

    // Indicator Dots
    if (this.dotsEl) {
      this.dotsEl.innerHTML = "";
      SLIDES.forEach((_, idx) => {
        const dot = document.createElement("span");
        dot.className = `pro-dot ${idx === this.currentSlide ? "on" : ""}`;
        this.dotsEl.appendChild(dot);
      });
    }

    // Action button labels
    const isLast = this.currentSlide === SLIDES.length - 1;
    if (this.nextBtn) {
      this.nextBtn.innerHTML = isLast
        ? `${lang === "fil" ? "GUMISING SA BARRACKS" : "AWAKEN IN BARRACKS"} <span class="kbd">↵</span>`
        : `${lang === "fil" ? "SUSUNOD" : "CONTINUE"} <span class="kbd">↵</span>`;
    }
    if (this.skipBtn) {
      this.skipBtn.textContent = lang === "fil" ? "Laktawan (ESC)" : "Skip (ESC)";
    }

    // Sound FX cues
    if (slide.sound === "thunder") {
      if (Sound.playThunder) Sound.playThunder();
    } else if (slide.sound === "darkness") {
      if (Sound.playDarkCast) Sound.playDarkCast();
    } else if (slide.sound === "holy") {
      if (Sound.playHolyBurst) Sound.playHolyBurst();
    }
  }

  next() {
    if (this.currentSlide < SLIDES.length - 1) {
      this.currentSlide++;
      if (Sound.playSelectMove) Sound.playSelectMove();
      this.render();
    } else {
      this.finish();
    }
  }

  finish() {
    if (!this.open) return;
    this.open = false;
    this.root.classList.remove("active");
    if (Sound.playHolyBurst) Sound.playHolyBurst();
    if (this.onComplete) this.onComplete();
  }

  handleInput(e) {
    if (!this.open) return;
    const c = e.code;
    if (c === "Space" || c === "Enter" || c === "KeyE") {
      e.preventDefault();
      this.next();
    } else if (c === "Escape") {
      e.preventDefault();
      this.finish();
    }
  }
}
