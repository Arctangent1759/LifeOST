var SONG_DIV_TEMPLATE='\
<div class="music-select-entry" style="border:1px solid gray; border-radius:15px; width:98%;">\
	<table style="width:100%;"><tr>\
		<td width="40%"><div style="width:100%; overflow:hidden"><div style="width:auto"><marquee behavior="alternate" scrollamount="2"><span style="padding-left:10px ; color:white;">{0}</span></marquee></div></div></td>\
		<td width="1%"></td>\
		<td width="59%"><div style="width:100%; overflow:hidden"><div style="width:auto"><marquee behavior="alternate" scrollamount="2"><span style="padding-left:10px ; color:white;">{1}</span></marquee></div></div></td>\
	</tr></table>\
</div>'
var lifeOST_ROOT="/sdcard/Android/data/com.lifeost.lifeost";

$(function(){
	var map = L.map('map').setView([37.87632, -122.25661], 13);
	L.tileLayer('http://{s}.tile.cloudmade.com/5c532a136a6646b0b2fdfe006adaa905/997/256/{z}/{x}/{y}.png', {
		//Pointless comment
		maxZoom: 18
	}).addTo(map);
	$('#map').append("<img style='position: absolute; top: 50%; left: 50%;' src='img/dot.png'></img>")
	document.addEventListener("deviceready",function(fs){
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,function(fs){
			fs.root.getDirectory(lifeOST_ROOT+"/profile",{create:false,exclusive:true},function(dir){
				dir.getFile("profile.json",null,function(fileEntry){
					fileEntry.file(function(file){
						var reader = new FileReader();
						reader.onloadend=function(evt){

							var save_data=window.JSON.parse(evt.target.result);
							var currpos;
							var curr_regions;
							var prevSongs;
							var currSongs;
							var currSongPath="";

							//Populate Map
							var curr_poly
							for (var i = 0; i < save_data.length; i++){
								curr_poly=L.polygon(save_data[i].geo,{color:'blue'}).addTo(map);
								curr_poly.music=save_data[i].music
								var popup="<b>Songs</b><br/><ul>";
								for (var j = 0; j < curr_poly.music.length; j++){
									popup+="<li>"+curr_poly.music[j].name+"</li>"
								}
								popup+="</ul>"
								curr_poly.bindPopup(popup);
							}

							//Load options
							load_options(function(){

								//Start Geo Computations
								navigator.geolocation.watchPosition(function(position){
									map.locate({setView: true, maxZoom: 16});
									curr_regions=[];
									curr_pos=[position.coords.latitude,position.coords.longitude]
									for (var i = 0; i < save_data.length; i++){
										if (polyContains(save_data[i].geo,curr_pos)){
											curr_regions.push(save_data[i])
										}
									}
									currSongs=getSongs(curr_regions);
									if (window.JSON.stringify(currSongs)!=window.JSON.stringify(prevSongs)){//If the songset changed
										//Update the song display div.
										prevSongs=currSongs;
										populateSongDiv(currSongs);
										//Update what's currently playing if the current song isn't in the current region.
										if (OPTION_SAVE_DATA.truncate){
											var curr_song_obselete=true;
											for (var i = 0; i < currSongs.length; i++){
												if (currSongs[i]==currSongPath){
													curr_song_obselete=false;
												}
											}
											if (curr_song_obselete){
												player.refresh();
											}
										}
									}
								},function(){},{maximumAge:OPTION_SAVE_DATA.geo_period,timeout:20000,enableHighAccuracy:true});

								//Start Media Player
								player = new MediaPlayer();
								function runMedia(){
									if (typeof currSongs != 'undefined' && currSongs.length != 0){
										var currSongPath=pick_random(currSongs);
										if (currSongPath){
											player.play(currSongPath,runMedia);
										}
									}
									else{
										setTimeout(function(){runMedia()},1000);
									}
								}
								runMedia()
							});
						}
						reader.readAsText(file);
					},function(){});
				},function(){});
			},function(){});
		},function(){
			alert("Profile not found. Create one now from the Create screen.")
		});
	});
});

//Hacky OO
function MediaPlayer(){
	this.play=function(music,onDone){
		this.onDone=onDone
		this.currMedia = new Media(music.path,function(){this.isDone=true; onDone();},function(){},function(){});
		this.currMedia.isDone=false
		this.currMedia.play()
	}
	this.refresh=function(){
		this.currMedia.stop();
		this.onDone()
		this.currMedia.release();
	}
	this.fullStop=function(){
		this.currMedia.stop();
		this.currMedia.release();
	}

	this.isDone=function(){
		if (! this.currMedia){
			return true
		}
		return this.currMedia.isDone
	}
}

//Helper functions
function getSongs(regions){
	/*
	 * Takes a list of regions, populates the song list, and reuturns a list of music objects.
	 */
	var music;
	var out = [];
	var skip;
	for (var i = 0; i < regions.length; i++){//For each region
		music = regions[i].music;
		for (var j = 0; j < music.length; j++){//For each song
			skip=false;
			for (var k = 0; k < out.length; k++){ //Add to out if not in out already
				if (music[k].path == out[j].path){
					skip=true;
					break;
				}
			}
			if (!skip){
				out.push(music[j])
			}
		}
	}
	return out
}
function populateSongDiv(music){
	$("#music-container").html("") //Clear the container
	for (var i = 0; i<music.length; i++){
		$("#music-container").append(SONG_DIV_TEMPLATE.format(music[i].name,music[i].path))
	}

}

function polyContains(poly,point)
{
	poly=latlngs_to_list(poly);
	var polysides=poly.length;
	var polyX=Array(polysides);
	var polyY=Array(polysides);
	for (var i = 0; i < poly.length; i ++)
	{
		polyX[i]=poly[i][0];
		polyY[i]=poly[i][1];
	}
	var x=point[0]
	var y=point[1]
	var j = polysides-1;
	var oddNodes=false;
	for (var i=0; i<polysides; i++){
		if ((polyY[i]< y && polyY[j]>=y
		||   polyY[j]< y && polyY[i]>=y)
		&&  (polyX[i]<=x || polyX[j]<=x)) {
			if (polyX[i]+(y-polyY[i])/(polyY[j]-polyY[i])*(polyX[j]-polyX[i])<x) {
				oddNodes=!oddNodes; 
			}
		}
	    j=i; 
	}
	return oddNodes
}

function latlngs_to_list(l){
	var out=[]
	for (var i = 0; i<l.length; i++){
		out.push([l[i].lat,l[i].lng])
	}
	return out
}

function pick_random(s){
	if (s.length==0){
		return false
	}
	return s[Math.floor(Math.random()*s.length)]
}

//Necessary mods
String.prototype.format=function(){
    var args=arguments;
    var out=this;
    for (var i = 0; i<args.length; i++){
	        out=out.replace("{"+i+"}",args[i])
	    }
    return out
}


