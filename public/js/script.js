let currentChallengeId = null;
let isVoting = false;

const DOM = {
  left: {
    option: document.querySelector("#left-option"),
    image: document.querySelector("#left-image"),
    loader: document.querySelector("#left-loader"),
    label: document.querySelector("#left-label"),
    percentage: document.querySelector("#left-percentage"),
    button: document.querySelector("#btn-left"),
  },
  right: {
    option: document.querySelector("#right-option"),
    image: document.querySelector("#right-image"),
    loader: document.querySelector("#right-loader"),
    label: document.querySelector("#right-label"),
    percentage: document.querySelector("#right-percentage"),
    button: document.querySelector("#btn-right"),
  },
  nextButton: document.querySelector("#next-button"),
  container: document.querySelector(".container"),
  actions: document.querySelector(".actions"),
  globalLoader: document.querySelector("#global-loader"),
  main: document.querySelector("main"),
};

const setLoading = (isLoading) => {
  if (isLoading) {
    DOM.globalLoader.classList.remove("hidden");
    DOM.main.classList.remove("loaded");
  } else {
    DOM.globalLoader.classList.add("hidden");
    DOM.main.classList.add("loaded");
  }
};

const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

const updateImage = async (side, newSrc) => {
  const { image, loader } = DOM[side];

  image.classList.remove("loaded");
  loader.classList.remove("hidden");

  try {
    await preloadImage(newSrc);
    image.src = newSrc;
    image.classList.add("loaded");
    loader.classList.add("hidden");
  } catch (error) {
    console.error("Error loading image:", error);
    image.src = "/images/error.jpg";
    image.classList.add("loaded");
    loader.classList.add("hidden");
  }
};

const resetUI = (data) => {
  ["left", "right"].forEach((side) => {
    const { option, percentage, label, button } = DOM[side];
    option.classList.remove("voted", "winner", "loser");
    percentage.textContent = "";
    label.textContent = data[`${side}_label`];
    button.style.display = "block";
  });
  DOM.nextButton.classList.remove("visible");
};

const fetchCurrentChallenge = async () => {
  setLoading(true);

  try {
    const data = await fetch("/api/challenges/current").then((r) => r.json());

    if (!data?.id) throw new Error("No challenge found");

    currentChallengeId = data.id;
    isVoting = false;
    resetUI(data);

    await Promise.all([
      updateImage("left", data.left_img_url),
      updateImage("right", data.right_img_url),
    ]);
  } catch (error) {
    console.error("Error fetching challenge:", error);
  } finally {
    setLoading(false);
  }
};

const vote = async (choice) => {
  if (!currentChallengeId) return;
  if (isVoting) {
    fetchCurrentChallenge();
    return;
  }

  setLoading(true);
  isVoting = true;

  try {
    DOM.left.button.style.display = "none";
    DOM.right.button.style.display = "none";

    const { leftVotes, rightVotes } = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: currentChallengeId, choice }),
    }).then((r) => r.json());

    displayResults(leftVotes, rightVotes);
  } catch (error) {
    console.error("Error voting:", error);
    DOM.left.button.style.display = "block";
    DOM.right.button.style.display = "block";
  } finally {
    setLoading(false);
  }
};

const displayResults = (leftVotes, rightVotes) => {
  const total = leftVotes + rightVotes;
  const getPercent = (votes) => (total ? Math.round((votes / total) * 100) : 0);

  const leftPercent = getPercent(leftVotes);
  const rightPercent = getPercent(rightVotes);

  ["left", "right"].forEach((side) => {
    const { option, percentage } = DOM[side];
    const percent = side === "left" ? leftPercent : rightPercent;

    option.classList.add("voted");
    percentage.textContent = `${percent}%`;
  });

  if (leftPercent !== rightPercent) {
    const winner = leftPercent > rightPercent ? "left" : "right";
    const loser = leftPercent > rightPercent ? "right" : "left";

    DOM[winner].option.classList.add("winner");
    DOM[loser].option.classList.add("loser");
  }

  DOM.nextButton.classList.add("visible");
};

const handleKeyPress = (event, side) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    vote(side);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  fetchCurrentChallenge();

  // Click handlers
  DOM.left.button.addEventListener("click", () => vote("left"));
  DOM.right.button.addEventListener("click", () => vote("right"));
  DOM.left.option.addEventListener("click", () => vote("left"));
  DOM.right.option.addEventListener("click", () => vote("right"));
  DOM.nextButton.addEventListener("click", fetchCurrentChallenge);

  // Keyboard handlers
  DOM.left.option.addEventListener("keypress", (e) =>
    handleKeyPress(e, "left")
  );
  DOM.right.option.addEventListener("keypress", (e) =>
    handleKeyPress(e, "right")
  );
});
