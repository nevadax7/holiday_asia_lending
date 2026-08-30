window.RESORTS_DATA = {
  thailand: {
    title: "Таиланд",
    hotels: [
      { slug: "view-talay-villas", name: "View Talay Villas", location: "Паттайя" },
      { slug: "veranda-resort-mgallery", name: "Veranda Resort MGallery", location: "Паттайя" },
      { slug: "grand-howard", name: "Grand Howard", location: "Бангкок" },
      { slug: "klong-prao-resort", name: "Klong Prao Resort", location: "о. Ко Чанг" },
      { slug: "mercure-ko-chang-resort", name: "Mercure Ko Chang Resort", location: "о. Ко Чанг" }
    ]
  },
  vietnam: {
    title: "Вьетнам",
    hotels: [
      { slug: "wyndham-royalbeach-resort", name: "Wyndham RoyalBeach Resort", location: "Дананг" },
      { slug: "naman-retreat", name: "Naman Retreat", location: "Дананг" },
      { slug: "carinae-hotel", name: "Carinae Hotel", location: "Дананг" },
      { slug: "peninsula-danang", name: "Peninsula Danang", location: "Дананг" },
      { slug: "the-hill-residence", name: "The Hill Residence", location: "о. Фукуок" }
    ]
  },
  turkey: {
    title: "Турция",
    hotels: [
      { slug: "bg-villas", name: "BG Villas", location: "Калкан" },
      { slug: "grand-makel-topkapi", name: "Grand Makel Topkapi", location: "Стамбул" },
      { slug: "marina-apart", name: "Marina Apart", location: "Измир" }
    ]
  },
  uae: {
    title: "ОАЭ",
    hotels: [
      { slug: "pacific-al-marian", name: "Pacific Al Marian", location: "ОАЭ" }
    ]
  },
  tenerife: {
    title: "о. Тенерифе",
    hotels: [
      { slug: "marylanza-suites-spa", name: "Marylanza Suites & Spa", location: "о. Тенерифе" },
      { slug: "tropicana-resort", name: "Tropicana Resort", location: "о. Тенерифе" }
    ]
  },
  montenegro: {
    title: "Черногория",
    hotels: [
      { slug: "sun-village", name: "Sun Village", location: "Черногория" }
    ]
  }
};

// Общая заглушка описания — пока конкретный текст для отеля не задан явно
// через поле description (массив абзацев) в объекте отеля выше.
window.RESORTS_DEFAULT_DESCRIPTION = [
  "Описание курорта будет добавлено позже. Здесь появится подробная информация о расположении, инфраструктуре, номерах и условиях проживания.",
  "Мы расскажем об особенностях территории, пляжной зоне, ресторанах и сервисах, а также о том, что делает этот отель удобным выбором для наших гостей.",
  "Актуальные фотографии и полное описание появятся здесь в ближайшее время."
];