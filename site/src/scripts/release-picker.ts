const form = document.querySelector<HTMLFormElement>("[data-release-picker]")!;
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const route = ["from", "to", "profile"].map((name) => data.get(name)).join("/");
  if ((JSON.parse(form.dataset.routes!) as string[]).includes(route)) location.assign(`${form.dataset.base}${route}/`);
});
