async function fetchAnime() {
    const query = `
              query ($username: String) {
                MediaListCollection(userName: $username, type: ANIME) {
                  lists {
                    status
                    entries {
                      media {
                      format
                        title {
                          romaji
                          english
                        }
                        id
                        popularity
                        startDate {
                          year
                        }
                        averageScore
                        rankings {
                          rank
                          allTime 
                        }
                        isAdult
                      }
                    }
                  }
                }
              }
            `;

    const user = document.getElementById('usernameInput').value.trim();
    const variables = { username: user };
    
    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({ query, variables }),
        });

        const data = await response.json();
        if (data.errors) {
            console.error('Error fetching data:', data.errors);
            alert('User not found. Please enter a valid username.');
            return [];
        }

        const compWatchAnime = data.data.MediaListCollection.lists.flatMap(
            (list) => list.entries.map((entry) => {
                const allTimeRanking = entry.media.rankings.find(ranking => ranking.allTime);
                return {
                    titleRomaji: entry.media.title.romaji || entry.media.title.english,
                    titleEnglish: entry.media.title.english || entry.media.title.romaji,
                    id: entry.media.id,
                    rank: allTimeRanking ? allTimeRanking.rank : null,
                    popularity: entry.media.popularity,
                    startDate: entry.media.startDate.year,
                    averageScore: entry.media.averageScore,
                    isAdult: entry.media.isAdult,
                    status: list.status,
                    format: entry.media.format
                };
            }).filter((anime) => 
              !anime.titleEnglish.toLowerCase().includes('season') && !anime.titleEnglish.toLowerCase().includes('cour') && anime.format !== 'MUSIC' &&
              !anime.isAdult && (anime.status === 'COMPLETED' || anime.status === 'CURRENT' || anime.status === 'PAUSED' || anime.status === 'DROPPED')
          )
        );

        console.log('Completed Anime:', compWatchAnime);
        return { username: user, animeList: compWatchAnime };
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('An error occurred while fetching data. Please try again later.');
        return [];
    }
}

function getTiers(list) {
  const tiers = {
      "Tier 1 (Sky)": [],
      "Tier 2 (High)": [],
      "Tier 3 (Surface)": [],
      "Tier 4 (Shallow)": [],
      "Tier 5 (Mid)": [],
      "Tier 6 (Deep)": [],
      "Tier 7 (Dark)": [],
      "Tier 8 (Abyss)": []
  };

  list.forEach((anime) => {
    const popularity = calculateObscurity(anime);
    if (popularity < 800) {
        tiers["Tier 1 (Sky)"].push(anime);
    } else if (popularity < 1200) {
        tiers["Tier 2 (High)"].push(anime);
    } else if (popularity < 1500) {
        tiers["Tier 3 (Surface)"].push(anime);
    } else if (popularity < 2000) {
        tiers["Tier 4 (Shallow)"].push(anime);
    }  else if (popularity < 2200) {
        tiers["Tier 5 (Mid)"].push(anime);
    } else if (popularity < 2600) {
        tiers["Tier 6 (Deep)"].push(anime);
    } else if (popularity < 3000) {
        tiers["Tier 7 (Dark)"].push(anime);
    } else {
        tiers["Tier 8 (Abyss)"].push(anime);
    }
  });

  return tiers;
}

function calculateObscurity(anime, maxPopularity = 800000) {
  const weightPopularity = 0.70;
  const weightRating = 0.30; 
  const currentYear = new Date().getFullYear();
  const normalizedPopularity = (maxPopularity - anime.popularity) / maxPopularity;
  const normalizedScore = (10 - (anime.averageScore / 10));
  const releaseYear = anime.startDate;
  const ageBonus = Math.max(0, (currentYear - releaseYear) * 0.007); 
  const obscurityScore = (
      normalizedPopularity * weightPopularity +
      normalizedScore * weightRating +
      ageBonus
  ) * 1000;
  console.log(anime.titleEnglish, obscurityScore);
  return obscurityScore;
}

function drawIceberg(username, tiers, language) {
  document.getElementById('downloadBtn').style.display = 'block';
  document.getElementById('canvas').style.display = 'block';  
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const icebergImage = new Image();
  icebergImage.crossOrigin = "anonymous";
  icebergImage.src = 'https://pbs.twimg.com/media/FWKrBD0XwAELJ_s?format=jpg&name=4096x4096'; 

  icebergImage.onload = () => {
      ctx.drawImage(icebergImage, 0, 0, canvas.width, canvas.height);

      ctx.font = '30px Comic Sans MS';
      ctx.fillStyle = 'black';
      ctx.lineWidth = 1.5;
      ctx.textAlign = 'center';
      ctx.strokeText(`${username}'s Aniberg`, canvas.width / 2, 50);
      ctx.fillText(`${username}'s Aniberg`, canvas.width / 2, 50);

      ctx.font = '13px Comic Sans MS';
      ctx.fillStyle = 'black';
      ctx.lineWidth = 0.1;
      ctx.textAlign = 'right';
      ctx.strokeText('https://seppukusoft.github.io/aniberg/', canvas.width - 10, 80);
      ctx.fillText('https://seppukusoft.github.io/aniberg/', canvas.width - 10, 80);

      const tierPositions = {
          "Tier 1 (Sky)": { x: 0, y: 90, width: 1000, height: 100 },
          "Tier 2 (High)": { x: 0, y: 240, width: 1000, height: 100 },
          "Tier 3 (Surface)": { x: 0, y: 380, width: 1000, height: 100 },
          "Tier 4 (Shallow)": { x: 0, y: 520, width: 1000, height: 100 },
          "Tier 5 (Mid)": { x: 0, y: 660, width: 1000, height: 100 },
          "Tier 6 (Deep)": { x: 0, y: 792, width: 1000, height: 100 },
          "Tier 7 (Dark)": { x: 0, y: 920, width: 1000, height: 100 },
          "Tier 8 (Abyss)": { x: 0, y: 1050, width: 1000, height: 100 }
      };

      ctx.font = '19px Comic Sans MS';
      ctx.fillStyle = 'black';
      ctx.lineWidth = 0.5;
      for (const [tier, position] of Object.entries(tierPositions)) {
        const selectedAnime = getRandomSubset(tiers[tier], 5);
        selectedAnime.forEach((anime, index) => {
            let textX, textY;
            if (index < 3) {
                textX = position.x + 25;
                textY = position.y + 40 + index * 50;
                ctx.textAlign = 'left';
            } else if (index < 6) {
                textX = position.x + position.width / 1.3 ;
                textY = position.y + 65 + (index - 3) * 50;
                ctx.textAlign = 'end';
            } else {
                textX = position.x + position.width / 2 - ctx.measureText(anime.titleRomaji || anime.titleEnglish).width *1.2;
                textY = position.y + 60 + 3 * 25;
                ctx.textAlign = 'center';
            }
            const text = language === 'English' ? anime.titleEnglish : anime.titleRomaji;
            ctx.strokeText(text, textX, textY);
            ctx.fillText(text, textX, textY);
        });
    }
};
}

function getRandomSubset(array, size) {
    const filteredArray = array.filter(anime => (anime.titleRomaji || anime.titleEnglish).length <= 40);
    const shuffled = filteredArray.slice(0);
    let i = filteredArray.length;
    const min = Math.max(i - size, 0);
    let temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}

document.getElementById('downloadBtn').addEventListener('click', () => {
  const canvas = document.getElementById('canvas');
  const link = document.createElement('a');

  // Ensure the canvas exists and has content
  if (canvas && canvas.toDataURL) {
    link.href = canvas.toDataURL('image/png'); // Specify PNG format
    link.download = 'iceberg.png'; // File name for the download

    // Append the link to the document to ensure proper click behavior
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); // Clean up the link after clicking
  } else {
    console.error('Canvas element is missing or not properly initialized.');
  }
});



document.getElementById('usernameInput').addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      document.getElementById("fetchButton").click();
    }
}); 

async function main() {
    const { username, animeList } = await fetchAnime();
    let tiers = getTiers(animeList);
    console.log(tiers);
    const language = document.querySelector('input[name="language"]:checked').value;
    console.log(`Selected language: ${language}`);
    drawIceberg(username, tiers, language);
}