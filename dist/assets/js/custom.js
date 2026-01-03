
  (function ($) {
  
  "use strict";

    // MENU
    $('#sidebarMenu .nav-link').on('click',function(){
      $("#sidebarMenu").collapse('hide');
    });
    
    // CUSTOM LINK
    $('.smoothscroll').click(function(){
      var el = $(this).attr('href');
      var elWrapped = $(el);
      var header_height = $('.navbar').height();
  
      scrollToDiv(elWrapped,header_height);
      return false;
  
      function scrollToDiv(element,navheight){
        var offset = element.offset();
        var offsetTop = offset.top;
        var totalScroll = offsetTop-navheight;
  
        $('body,html').animate({
        scrollTop: totalScroll
        }, 300);
      }
    });

    //Custom leaderboard
    let data = [
  { rank: 0, name: "user1", score: 0, color: "#66bb6a" },
  { rank: 0, name: "user2", score: 0, color: "#a1887f" },
  { rank: 0, name: "user3", score: 0, color: "#42a5f5" },
  { rank: 0, name: "user4", score: 0, color: "#ffa726" },
  { rank: 0, name: "user5", score: 0, color: "#ef5350" },
  { rank: 0, name: "user6", score: 0, color: "#5c6bc0" },
];

let container = document.querySelector(".container-badges");

data
  .sort((a, b) => {
    if (b.score === a.score) {
      return a.name.localeCompare(b.name); // Sort by name if scores are equal
    }
    return b.score - a.score; // Sort by score in descending order
  })
  .forEach((e, i) => (e.rank = i));

data.forEach((el, i) => {
  let box = document.createElement("div");
  box.className = "team";
  box.style.setProperty("--i", i); // Use 0-based index for initial display
  box.style.setProperty("--color", el.color);
  //name
  let name = document.createElement("span");
  name.className = "name";
  name.innerHTML = el.name;
  //icon
  let icon = document.createElement("img");
  icon.src = "assets/imgs/avatar-" + el.name + ".png";
  //start of badge/score overlay group
  let itemContainer = document.createElement("div");
  itemContainer.classList.add("rank-item-container");
  //badge
  let badge = document.createElement("img");
  badge.classList.add("badge");
  badge.src = "assets/imgs/rank-" + el.rank + ".png";
  //score
  let score = document.createElement("span");
  score.className = "score";
  score.innerHTML = el.score;
  // Assemble the itemContainer
  itemContainer.appendChild(badge);
  itemContainer.appendChild(score);
  // --- End of the Badge/Score Overlay Group ---
  
  // Assemble the main team box
  box.appendChild(icon);
  box.appendChild(name);
  // *** FIX: Append the itemContainer inside the box ***
  box.appendChild(itemContainer); 

  // Append the complete box to the main badges container
  container.appendChild(box);

  box.addEventListener("click", () => {
    let elName = box.querySelector(".name").innerHTML;
    /*data.find((team) => team.name === elName);
    data.find((team) => team.name === elName).score += 1;*/
    const currentTeam = data.find((team) => team.name === elName);
    currentTeam.score += 1;
    data
      .sort((a, b) => {
        if (b.score === a.score) {
          return a.name.localeCompare(b.name); // Sort by name if scores are equal
        }
        return b.score - a.score; // Sort by score in descending order
      })
      .forEach((e, i) => (e.rank = i));
    let AllTeams = Array.from(document.querySelectorAll(".team"));
    AllTeams.forEach((element) => {
      let elementName = element.querySelector(".name");
      let currentTeamName = elementName.innerHTML;
      /*let elementScore = element.querySelector(".score");*/

      let updatedTeamData = data.find((team) => team.name === currentTeamName);
      let newRank = updatedTeamData.rank;

      let elementScore = element.querySelector(".score");
      elementScore.innerHTML = updatedTeamData.score; 
      // Update the text from the data model, not just increment it

      // Update the rank positioning using CSS variable
      element.style.setProperty("--i", newRank);
      
      /*if (elementName.innerHTML == elName) {
        elementScore.innerHTML++;
      }
      let newRank = data.find(
        (team) => team.name === elementName.innerHTML
      ).rank;
      element.style.setProperty("--i", newRank);*/
      let badgeImg = element.querySelector(".badge");
      if (badgeImg) {
          badgeImg.src = "assets/imgs/rank-" + updatedTeamData.rank + ".png";
      }

      console.log(updatedTeamData);
      
      /*console.log(data.find((team) => team.name === elementName.innerHTML));*/
    });
  });
});

  
})(window.jQuery);

  

