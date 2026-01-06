(function () {
    'use strict';

    const timeline = document.querySelector('.timeline2');

    function callbackFunc() {
        const items = timeline.querySelectorAll(".timeline2 li");
        const containerRect = timeline.getBoundingClientRect();

        items.forEach(li => {
            const rect = li.getBoundingClientRect();

            // On vérifie si le milieu du 'li' est à l'intérieur des limites du container
            const liMidPoint = rect.top + (rect.height / 2);

            const isInView = (liMidPoint >= containerRect.top && liMidPoint <= containerRect.bottom);

            if (isInView) {
                li.classList.add("in-view");
            } else {
                // Optionnel : retirez le commentaire ci-dessous si vous voulez 
                // que l'animation se rejoue à chaque passage
                // li.classList.remove("in-view");
            }
        });
    }

    // Déclenchement au chargement et lors du scroll INTERNE
    window.addEventListener("load", callbackFunc);
    timeline.addEventListener("scroll", callbackFunc);
    window.addEventListener("resize", callbackFunc);
})();
