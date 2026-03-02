import { language } from "./interface/header"

export const headerNotification = [
  {
    id: 1,
    title: "Delivery processing",
    time: "10 min.",
    bgClass: "primary",
    textClass: "danger"
  },
  {
    id: 2,
    title: "Order Complete",
    time: "1 hr",
    bgClass: "success",
    textClass: "success"
  },
  {
    id: 3,
    title: "Tickets Generated",
    time: "3 hr",
    bgClass: "secondary",
    textClass: "secondary"
  },
  {
    id: 4,
    title: "Delivery Complete",
    time: "6 hr",
    bgClass: "warning",
    textClass: "warning"
  }
]

export const headerMessage = [
  {
    id: 1,
    name: "Helen Walter",
    image: "assets/images/user/3.jpg",
    message: "Do you want to go see movie?"
  },
  {
    id: 2,
    name: "Jason Borne",
    image: "assets/images/user/6.jpg",
    message: "Thank you for rating us."
  },
  {
    id: 3,
    name: "Sarah Loren",
    image: "assets/images/user/10.jpg",
    message: "What`s the project report update?"
  }
]

export const headerCart = [
  {
    id: 1,
    title: 'Furniture Chair for Home',
    image: 'assets/images/other-images/cart-img.jpg',
    price: '$500',
    value: 1
  },
  {
    id: 2,
    title: 'Furniture Chair for Home',
    image: 'assets/images/other-images/cart-img.jpg',
    price: '$500',
    value: 1
  }
]

export const languages: language[] = [
  {
    language: 'English',
    code: 'en',
    type: 'US',
    icon: 'us',
    active: true
  },
  {
    language: 'Español',
    code: 'es',
    icon: 'es'
  },
  {
    language: 'Français',
    code: 'fr',
    icon: 'fr'
  },
  {
    language: 'Português',
    code: 'pt',
    type: 'BR',
    icon: 'pt'
}]

export const userProfile = [
  {
    id: 1,
    title: "Account",
    icon: "user"
  },
  {
    id: 2,
    title: "Inbox",
    icon: "mail"
  },
  {
    id: 3,
    title: "Taskboard",
    icon: "file-text"
  },
  {
    id: 4,
    title: "Settings",
    icon: "settings"
  },
  {
    id: 5,
    title: "Log Out",
    icon: "log-in"
  }
]
