document.addEventListener("DOMContentLoaded", () => {
  const inputs = document.querySelectorAll(".input");
  inputs.forEach((input) => {
    input.addEventListener("focus", () => {
      let parent = input.parentNode.parentNode;
      parent.classList.add("focus");
    });
    input.addEventListener("blur", () => {
      let parent = input.parentNode.parentNode;
      if (input.value === '') {
        parent.classList.remove("focus");
      }
    });
  });
});
