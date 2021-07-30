var URL_BASE = "https://keeper.battlelog.com/snapshot/";
var debug = true;

//Setup jQuery AJAX error reporting
$.ajaxSetup({
  error: function(xhr, status, error) {
    console.log("An AJAX error occured: " + status + "\nError: " + error);
	console.log("XHR: " + xhr);
  }
});

var serverGuid = "";

var regex = new RegExp(/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}/);

//AJAX url is view-source:https://keeper.battlelog.com/snapshot/<server guid>
//image prefix chrome-extension://kldlinoiepbhlcjkmbpgcckhdfjgjcgk/warning-32.png

var url = String(document.location);

console.log("Page: " + url);

var found = regex.exec(url);

if (found != null && found.length > 0)
{
	serverGuid = found[0];
	console.log("Current page is a server page with GUID " + serverGuid);
	processServerPage();
} else {
	processSearchResults();
	
	setInterval(processSearchResults, 5000);
}

function parse(data)
{
	//Fix for Firefox: https://stackoverflow.com/questions/15937416/jquery-get-not-working-in-firefox-and-ie
	if (typeof data === "string"){
		return JSON.parse(data);
	}
	
	return data;
}

function processSearchResults()
{
	console.log("#### RUNNING UPDATE");
	
	$('.server-row').each(function (index) {
		var guid = $(this).data("guid");
		
		console.log($($(this).find('td.players')[0]).html());
		
		if ($($(this).find('td.players')[0]).html().includes('spoof'))
			return;
			
		var _this = this; //preserve context
		
		console.log("Processing server with GUID " + guid);
		
			$.get(URL_BASE + guid, function( data ) {
				//console.log(data);
				
				if (data.snapshot.status == "SUCCESS")
				{
					var actualPlayerCount = 0;
					var maxPlayers = data.snapshot.maxPlayers;
					
					for(var team_id in data.snapshot.teamInfo)
					{
						for(var player_id in data.snapshot.teamInfo[team_id].players)
						{
							//console.log("Team ID " + team_id + " - Player ID " + player_id);
							actualPlayerCount++;
						}
					}
					
					console.log("Server actual player count: " + actualPlayerCount);
					
					//$($(_this).find('td.players'))
					
					var playerCountObject = $(_this).find('span.occupied')[0];
					
					//console.log(playerCountObject);
					
					//var content = $(playerCountObject).html();;
					
					//console.log(content);
					
					var number = $(playerCountObject).html();
					
					var reportedPlayerCount = parseInt(number);
					
					console.log("Server reported player count: " + reportedPlayerCount);
					
					if (actualPlayerCount != reportedPlayerCount)
					{
						console.log("Server is SPOOFING player count. Adding warning symbol.");
						
					var html_obj = "<td class='players'><div id='spoof-warning-small'></div><span class='occupied spoof-text'>" + actualPlayerCount + "</span> / <span class='max spoof-text'>" + maxPlayers + "</span><p>SPOOFED</p></td>";
						
						$(_this).find('td.players').replaceWith(html_obj);
					} else {
						console.log("Server is not spoofing player count. Adding ok/verified symbol.");
						
						var html_obj = "<td class='players'><div id='spoof-ok-small'></div><span class='occupied spoof-text'>" + actualPlayerCount + "</span> / <span class='max spoof-text'>" + maxPlayers + "</span></td>";
						
						$(_this).find('td.players').replaceWith(html_obj);
					}
				}
			  
			});
		
	});
}

function processServerPage()
{
	var jsonUrl = URL_BASE + serverGuid;
	
	console.log("Sending GET request for JSON data with url: " + jsonUrl);
	
	$.ajax({
		async: false,
		url: jsonUrl,
		type: 'GET',
		dataType: 'json',
		success: function( data ) {
			data = parse(data); //Make sure data is parsed correctly for Firefox and IE
			
			console.log(data);
			
			if (data.snapshot.status == "SUCCESS")
			{
				var actualPlayerCount = 0;
				var maxPlayers = data.snapshot.maxPlayers;
				
				for(var team_id in data.snapshot.teamInfo)
				{
					for(var player_id in data.snapshot.teamInfo[team_id].players)
					{
						//console.log("Team ID " + team_id + " - Player ID " + player_id);
						actualPlayerCount++;
					}
				}
				
				console.log("Server actual player count: " + actualPlayerCount);
				
				var playerCountObject = $('#server-page-info > div:nth-child(2) > div:nth-child(1) > section > h5')[0];
				
				var content = playerCountObject;
				
				var number = $(content).html().trim().split(' / '); //really ugly but I want this done, I'm tired
				
				var reportedPlayerCount = parseInt(number);
				
				console.log("Server reported player count: " + reportedPlayerCount);
				
				if (actualPlayerCount != reportedPlayerCount)
				{
					console.log("Server is SPOOFING player count. Adding warning symbol.");
					
					var html_obj = "<div id='spoof-warning'></div><h5 id='spoof-text'>" + actualPlayerCount + " / " + maxPlayers + "</h5><h5>SPOOFED</h5>";
					
					$(playerCountObject).replaceWith(html_obj);
				} else {
					console.log("Server is not spoofing player count. Adding ok/verified symbol.");
					
					var html_obj = "<div id='spoof-ok'></div><h5 id='spoof-text'>" + actualPlayerCount + " / " + maxPlayers + "</h5><h5>VERIFIED</h5>";
					
					$(playerCountObject).replaceWith(html_obj);
				}
			} else 
			{
				console.log("Unable to query for snapshot data. data.snapshot.status field not set to 'SUCCESS'. Actual data='" + data + "'");
			}
	},
	// error: function(data) { 
		// data = parse(data); //Make sure data is parsed correctly for Firefox and IE
		// console.log("ERROR: " + data); 
	// }
	});
		
	console.log("Server page processed. Exiting script.");
}

