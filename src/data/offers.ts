export interface Offer {
  title: string;
  subtitle: string;
  image: string;
  link: string;
  tags: string[];
}

export const offersData: Offer[] = [
  {
    title: "Banque Populaire Grand Ouest",
    subtitle: "Offres bancaires spéciales étudiants, avantages à l’ouverture de compte, places de ski offertes.",
    image: "/offer/bqgo.png",
    link: "https://agences.banquepopulaire.fr/banque-assurance/agence-lannion-id1380700544",
    tags: ["Banque"],
  },
  {
    title: "Le Truc",
    subtitle: "Cocktails/mocktails à prix réduit, réduction sur le bec de bonde, billard gratuit pour étudiants.",
    image: "/offer/letruccafe.jpg",
    link: "https://www.google.com/maps/search/?api=1&query=Le+Truc+Lannion",
    tags: ["Bar", "Loisirs"],
  },
  {
    title: "Rosa Louise",
    subtitle: "Menu étudiant à 10€ (Cheeseburger, Pâtes saumon, Poke Bowl), Loburg à 2€ (25cl) ou 4€ (50cl).",
    image: "/offer/rosalouise.png",
    link: "https://www.google.com/maps/search/?api=1&query=Rosa+Louise+Lannion",
    tags: ["Bar", "Restauration"],
  },
  {
    title: "Marie Blachère",
    subtitle: "Pour une formule sandwich (sandwich + boisson), dessert offert.",
    image: "/offer/marie_blachere.png",
    link: "https://www.google.com/maps/search/?api=1&query=Marie+Blachère+Lannion",
    tags: ["Restauration"],
  },
  {
    title: "Le Diplomate",
    subtitle: "Tarifs préférentiels au bar sur présentation de la carte étudiante.",
    image: "/offer/lediplo.png",
    link: "https://www.google.com/maps/search/?api=1&query=Le+Diplomate+Lannion",
    tags: ["Bar"],
  },
  {
    title: "Mood Club",
    subtitle: "Entrée à 10€ avec consommation pour étudiants (au lieu de 15€), majeurs uniquement.",
    image: "/offer/moodclubicone.png",
    link: "https://www.google.com/maps/search/?api=1&query=Mood+Club+Lannion",
    tags: ["Boîte de nuit", "18+"],
  },
];
