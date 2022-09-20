import React from "react";
import api from "../utils/api";
import { Route, Switch, Redirect, useHistory } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import Footer from "./Footer";
import Header from "./Header";
import Main from "./Main";
import Login from "./Login";
import Register from "./Register";
import InfoTooltip from "./InfoTooltip";
import EditProfilePopup from "./EditProfilePopup";
import EditAvatarPopup from "./EditAvatarPopup";
import AddPlacePopup from "./AddPlacePopup";
import ImagePopup from "./ImagePopup";
import { CurrentUserContext } from "../contexts/CurrentUserContext";
import { CardsContext } from "../contexts/CardsContext";
import * as auth from "../utils/auth";

function App() {
  const history = useHistory();

  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] =
    React.useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = React.useState(false);
  const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] =
    React.useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = React.useState(false);
  const [selectedCard, setSelectedCard] = React.useState({
    name: "",
    link: "",
  });
  const [currentUser, setCurrentUser] = React.useState({});
  const [cards, setCards] = React.useState([]);

  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [email, setEmail] = React.useState("");

  const [isInfoTooltipOpen, setIsInfoTooltipOpen] = React.useState(false);
  const [toolTipStatus, setToolTipStatus] = React.useState("");

  React.useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (token) {
      auth
        .checkToken(token)
        .then((res) => {
          if (res) {
            setEmail(res.data.email);
            setIsLoggedIn(true);
            history.push("/");
          } else {
            localStorage.removeItem("jwt");
          }
        })
        .catch((err) => console.log(err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

 


  const handleEditAvatarClick = () => {
    setIsEditAvatarPopupOpen(true);
  };

  const handleEditProfileClick = () => {
    setIsEditProfilePopupOpen(true);
  };

  const handleAddPlaceClick = () => {
    setIsAddPlacePopupOpen(true);
  };

  function handleCardClick(card) {
    setIsImagePreviewOpen(true);
    setSelectedCard({
      name: card.name,
      link: card.link,
    });
  }

  React.useEffect(() => {
    api
      .getUserInfo()
      .then((res) => {
        setCurrentUser(res);
      })
      .catch((err) => console.log(err));
  }, []);

  function handleUpdateUser({ name, about }) {
    api
      .editProfile({ name, about })
      .then((res) => {
        setCurrentUser(res);
        closeAllPopups();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleAvatarUpdate({ avatar }) {
    api
      .setUserAvatar({ avatar })
      .then((res) => {
        setCurrentUser(res);
      })
      .then(closeAllPopups)
      .catch((err) => console.log(err));
  }

  function handleCardUpdate({ name, link }) {
    api
      .createCard({ name, link })
      .then((res) => {
        setCards([res, ...cards]);
      })
      .then(closeAllPopups)
      .catch((err) => console.log(err));
  }

  function handleCardLike(card) {
    const isLiked = card.likes.some((user) => user._id === currentUser._id);
    api
      .likeCard(card._id, !isLiked)
      .then((newCard) => {
        setCards((state) =>
          state.map((currentCard) =>
            currentCard._id === card._id ? newCard : currentCard
          )
        );
      })
      .catch((err) => {
        console.log(err);
      });
  }
  function handleRemoveCard(card) {
    api
      .deleteCard(card._id)
      .then((res) => {
        setCards((cards) =>
          cards.filter((cardToStay) => cardToStay._id !== card._id)
        );
      })
      .catch((err) => console.log(err));
  }

  React.useEffect(() => {
    api
      .getInitialCards()
      .then((res) => {
        setCards(res);
      })
      .catch((err) => console.log(err));
  }, []);



  const closeAllPopups = () => {
    setIsAddPlacePopupOpen(false);
    setIsEditAvatarPopupOpen(false);
    setIsEditProfilePopupOpen(false);
    setIsImagePreviewOpen(false);
    setIsInfoTooltipOpen(false);
  };
  
   React.useEffect(() => {
     const closeByEscape = (e) => {
       if (e.key === "Escape") {
         closeAllPopups();
       }
     };

     document.addEventListener("keydown", closeByEscape);

     return () => document.removeEventListener("keydown", closeByEscape);
   }, []);

   function onRegister({ email, password }) {
     auth
       .register(email, password)
       .then((res) => {
         if (res.data._id) {
           console.log(res.data._id);
           setToolTipStatus("success");
           setIsInfoTooltipOpen(true);
           history.push("/signin");
         } else {
           setToolTipStatus("fail");
           setIsInfoTooltipOpen(true);
         }
       })
       .catch((err) => {
         console.log(err);
         setToolTipStatus("fail");
         setIsInfoTooltipOpen(true);
       });
   }

   function onLogin({ email, password }) {
     auth
       .login(email, password)
       .then((res) => {
         if (res.token) {
           
           setIsLoggedIn(true);
           setEmail(email);
           localStorage.setItem("jwt", res.token);

           history.push("/");
           console.log(res.token);
         } else {
           setToolTipStatus("fail");
           setIsInfoTooltipOpen(true);
         }
       })
       .catch((err) => {
         console.log(err);
         setToolTipStatus("fail");
         setIsInfoTooltipOpen(true);
       });
   }

   function onSignOut() {
     localStorage.removeItem("jwt");
     setIsLoggedIn(false);
     history.push("/signin");
   }
  
  return (
    <CurrentUserContext.Provider value={currentUser}>
      <CardsContext.Provider value={cards}>
        <Header email={email} onSignOut={onSignOut} />
        <Switch>
          <Route path="/signup">
            <Register onRegister={onRegister} />
          </Route>
          <Route path="/signin">
            <Login onLogin={onLogin} />
          </Route>
          <Route>
            {isLoggedIn ? <Redirect to="/" /> : <Redirect to="/signin" />}
            <ProtectedRoute path="/" isLoggedIn={isLoggedIn}>
              <Main
                onEditProfileClick={handleEditProfileClick}
                onAddPlaceClick={handleAddPlaceClick}
                onEditAvatarClick={handleEditAvatarClick}
                onCardClick={handleCardClick}
                onCardLike={handleCardLike}
                onDeleteClick={handleRemoveCard}
              />
            </ProtectedRoute>
          </Route>
        </Switch>

        <EditProfilePopup
          isOpen={isEditProfilePopupOpen}
          onClose={closeAllPopups}
          onUpdateUser={handleUpdateUser}
        />
        <AddPlacePopup
          isOpen={isAddPlacePopupOpen}
          onClose={closeAllPopups}
          onCardsUpdate={handleCardUpdate}
        />
        <EditAvatarPopup
          isOpen={isEditAvatarPopupOpen}
          onClose={closeAllPopups}
          onAvatarUpdate={handleAvatarUpdate}
        />
        <ImagePopup
          card={selectedCard}
          isOpen={isImagePreviewOpen}
          onClose={closeAllPopups}
        />

        <Footer />
        <InfoTooltip
          isOpen={isInfoTooltipOpen}
          onClose={closeAllPopups}
          status={toolTipStatus}
        />
      </CardsContext.Provider>
    </CurrentUserContext.Provider>
  );
}

export default App;
