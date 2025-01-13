async function fetchAnime() {
    const query = `
              query ($username: String) {
                MediaListCollection(userName: $username, type: ANIME) {
                  lists {
                    status
                    entries {
                      media {
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
                    status: list.status
                };
            }).filter((anime) => 
              !anime.titleEnglish.toLowerCase().includes('season') && 
              !anime.isAdult && (anime.status === 'COMPLETED' || anime.status === 'CURRENT')
          )
        );

        console.log('Completed Anime:', compWatchAnime);
        return compWatchAnime;
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
      "Tier 7 (Abyss)": []
  };

  list.forEach((anime) => {
    const popularity = calculateObscurity(anime);
    if (popularity < 1000) {
        tiers["Tier 1 (Sky)"].push(anime);
    } else if (popularity < 1300) {
        tiers["Tier 2 (High)"].push(anime);
    } else if (popularity < 1600) {
        tiers["Tier 3 (Surface)"].push(anime);
    } else if (popularity < 1900) {
        tiers["Tier 4 (Shallow)"].push(anime);
    }  else if (popularity < 2200) {
        tiers["Tier 5 (Mid)"].push(anime);
    } else if (popularity < 2500) {
        tiers["Tier 6 (Deep)"].push(anime);
    } else {
        tiers["Tier 7 (Abyss)"].push(anime);
    }
  });

  return tiers;
}

function calculateObscurity(anime, maxPopularity = 800000) {
  const WEIGHT_POPULARITY = 0.75;
  const WEIGHT_SCORE = 0.25; 
  const CURRENT_YEAR = new Date().getFullYear();

  // Normalize popularity (lower is better for obscurity)
  const normalizedPopularity = (maxPopularity - anime.popularity) / maxPopularity;

  // Normalize score (lower is better for obscurity)
  const normalizedScore = (10 - (anime.averageScore / 10));

  // Age bonus (older anime are more obscure)
  const releaseYear = anime.startDate;
  const ageBonus = Math.max(0, (CURRENT_YEAR - releaseYear) * 0.005); // 0.02 points per year

  // Calculate final obscurity score
  const obscurityScore = (
      normalizedPopularity * WEIGHT_POPULARITY +
      normalizedScore * WEIGHT_SCORE +
      ageBonus
  ) * 1000;
  return obscurityScore;
}

function drawIceberg(tiers) {
  document.getElementById('downloadBtn').style.display = 'block';
  document.getElementById('canvas').style.display = 'block';  
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const icebergImage = new Image();
  icebergImage.src = 'https://pbs.twimg.com/media/FWKrBD0XwAELJ_s?format=jpg&name=4096x4096'; 

  icebergImage.onload = () => {
      ctx.drawImage(icebergImage, 0, 0, canvas.width, canvas.height);

      ctx.font = '30px Verdana';
      ctx.fillStyle = 'red';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText('Aniberg', canvas.width / 2, 50);
      ctx.fillText('Aniberg', canvas.width / 2, 50);

      const tierPositions = {
          "Tier 1 (Sky)": { x: 0, y: 90, width: 1000, height: 100 },
          "Tier 2 (High)": { x: 0, y: 240, width: 1000, height: 100 },
          "Tier 3 (Surface)": { x: 0, y: 380, width: 1000, height: 100 },
          "Tier 4 (Shallow)": { x: 0, y: 520, width: 1000, height: 100 },
          "Tier 5 (Mid)": { x: 0, y: 635, width: 1000, height: 100 },
          "Tier 6 (Deep)": { x: 0, y: 765, width: 1000, height: 100 },
          "Tier 7 (Abyss)": { x: 0, y: 895, width: 1000, height: 100 }
      };

      ctx.font = '20px Verdana';
      ctx.fillStyle = 'red';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;

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
            const text = `${anime.titleEnglish || anime.titleRomaji}`;
            ctx.strokeText(text, textX, textY);
            ctx.fillText(text, textX, textY);
        });
    }
};
}

function getRandomSubset(array, size) {
  const filteredArray = array.filter(anime => (anime.titleRomaji || anime.titleEnglish).length <= 50);
  const shuffled = filteredArray.slice(0);
  let i = filteredArray.length;
  const min = i - size;
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
  link.download = 'iceberg-tiers.png';
  link.href = canvas.toDataURL();
  link.click();
});

async function main() {
    let list = await fetchAnime();
    let tiers = getTiers(list);
    console.log(tiers);
    drawIceberg(tiers);
}