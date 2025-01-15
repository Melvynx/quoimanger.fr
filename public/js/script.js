let currentChallengeId = null;

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

async function updateImage(imageId, loaderId, newSrc) {
  const imgElement = document.getElementById(imageId);
  const loaderElement = document.getElementById(loaderId);

  // Reset image state
  imgElement.classList.remove("loaded");
  loaderElement.classList.remove("hidden");

  try {
    // Précharger la nouvelle image
    await preloadImage(newSrc);

    // Une fois chargée, mettre à jour l'image et masquer le loader
    imgElement.src = newSrc;
    imgElement.classList.add("loaded");
    loaderElement.classList.add("hidden");
  } catch (error) {
    console.error("Error loading image:", error);
    // En cas d'erreur, on peut afficher une image par défaut
    imgElement.src = "/images/error.jpg";
    imgElement.classList.add("loaded");
    loaderElement.classList.add("hidden");
  }
}

async function fetchCurrentChallenge() {
  try {
    const response = await fetch("/api/challenges/current");
    const data = await response.json();

    if (!data.id) {
      throw new Error("No challenge found");
    }

    currentChallengeId = data.id;

    // Reset UI
    document.getElementById("left-option").classList.remove("voted", "loser");
    document.getElementById("right-option").classList.remove("voted", "loser");
    document.getElementById("left-percentage").textContent = "";
    document.getElementById("right-percentage").textContent = "";
    document.getElementById("next-button").classList.remove("visible");

    // Update labels immediately
    document.getElementById("left-label").textContent = data.left_label;
    document.getElementById("right-label").textContent = data.right_label;

    // Reset flex basis
    document.getElementById("left-option").style.flex = "1";
    document.getElementById("right-option").style.flex = "1";

    // Enable buttons
    document.getElementById("btn-left").style.display = "inline-block";
    document.getElementById("btn-right").style.display = "inline-block";

    // Update images with loading states
    await Promise.all([
      updateImage("left-image", "left-loader", data.left_img_url),
      updateImage("right-image", "right-loader", data.right_img_url),
    ]);
  } catch (error) {
    console.error("Error fetching challenge:", error);
  }
}

async function vote(choice) {
  if (!currentChallengeId) return;

  try {
    // Disable both buttons
    document.getElementById("btn-left").style.display = "none";
    document.getElementById("btn-right").style.display = "none";

    const response = await fetch("/api/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        challengeId: currentChallengeId,
        choice,
      }),
    });

    const result = await response.json();
    displayResults(result.leftVotes, result.rightVotes);
  } catch (error) {
    console.error("Error voting:", error);
    // Re-enable buttons in case of error
    document.getElementById("btn-left").style.display = "inline-block";
    document.getElementById("btn-right").style.display = "inline-block";
  }
}

function displayResults(leftVotes, rightVotes) {
  const total = leftVotes + rightVotes;
  const leftPercent = total ? Math.round((leftVotes / total) * 100) : 0;
  const rightPercent = total ? Math.round((rightVotes / total) * 100) : 0;

  // Add voted class to both options
  document.getElementById("left-option").classList.add("voted");
  document.getElementById("right-option").classList.add("voted");

  // Display percentages
  document.getElementById("left-percentage").textContent = `${leftPercent}%`;
  document.getElementById("right-percentage").textContent = `${rightPercent}%`;

  // Adjust flex basis based on percentages
  document.getElementById("left-option").style.flex = `${leftPercent}`;
  document.getElementById("right-option").style.flex = `${rightPercent}`;

  // Apply grayscale to the loser
  if (leftPercent < rightPercent) {
    document.getElementById("left-option").classList.add("loser");
  } else if (rightPercent < leftPercent) {
    document.getElementById("right-option").classList.add("loser");
  }

  // Show next button
  document.getElementById("next-button").classList.add("visible");
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  fetchCurrentChallenge();

  document
    .getElementById("btn-left")
    .addEventListener("click", () => vote("left"));
  document
    .getElementById("btn-right")
    .addEventListener("click", () => vote("right"));
  document
    .getElementById("next-button")
    .addEventListener("click", fetchCurrentChallenge);
});
