const themeImage = document.getElementById("nav-logo");
const lightImageSrc = "../static/images/logo.png";
const darkImageSrc = "../static/images/logo-dark.png";

const updateLogoWithTheme = () => {
  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.getElementById("nav-logo").src = isDarkMode
    ? darkImageSrc
    : lightImageSrc;
};

updateLogoWithTheme();
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", updateLogoWithTheme);
