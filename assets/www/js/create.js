//Globals
var GLOBALS=true;
var MUSIC_SEARCH_LOCATIONS=["/sdcard/Music",
	"/sdcard/Android/data/com.google.android.music/cache",
	"/data/data/com.google.android.music/"];
var lifeOST_ROOT="/sdcard/Android/data/com.lifeost.lifeost";
var SONG_DIV_TEMPLATE='\
<div class="music-select-entry" style="border:1px solid gray; border-radius:15px; width:98%;">\
	<table style="width:100%;"><tr>\
		<td width="20%"><div style="width:100%; overflow:hidden"><div style="width:auto"><marquee behavior="alternate" scrollamount="2"><span style="padding-left:10px ; color:white;">{0}</span></marquee></div></div></td>\
		<td width="1%"></td>\
		<td width="39%"><div style="width:100%; overflow:hidden"><div style="width:auto"><marquee behavior="alternate" scrollamount="2"><span style="padding-left:10px ; color:white;">{1}</span></marquee></div></div></td>\
		<td width="10%" align="center"><span style="padding-right:10px ; color:white;"><input class="music-checkbox" type="CHECKBOX"/></span></td>\
	</tr></table>\
</div>'
var LOCAL_STORAGE_LOCATION=''

var mode="addpolygon";
var regions=[]
var currpoly=[]
var poly_vis=false


//Application Logic
$(function(){
	//Create the map and initialize it.
	$('#map').height($('#map').width());
	var map = L.map('map').setView([37.87632, -122.25661], 13);
	L.tileLayer('http://{s}.tile.cloudmade.com/5c532a136a6646b0b2fdfe006adaa905/997/256/{z}/{x}/{y}.png', {
		maxZoom: 18
	}).addTo(map);

	//On deviceready...
	document.addEventListener("deviceready",function(){

		//Center the map
		navigator.geolocation.getCurrentPosition(function(){map.locate({setView: true, maxZoom: 16});},function(){alert("GPS Communication Failure.");})

		//Load a file system, and prepare to load data.
		var save_data=false;
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
			for (var i = 0; i < MUSIC_SEARCH_LOCATIONS.length; i++){
				//Load music and populate the music picker.
				fs.root.getDirectory(MUSIC_SEARCH_LOCATIONS[i],{create:false,exclusive:true},function(dir){
					var reader=dir.createReader();
					reader.readEntries(function(entries){
						for (var i = 0; i<entries.length; i++){
							addSong(entries[i].fullPath);
						}
					},function(){
						alert("Could not read directory {0}".format(MUSIC_SEARCH_LOCATIONS[i]))
					});

				},function(){
					alert("Directory {0} cannot be found.".format(MUSIC_SEARCH_LOCATIONS[i]))
				})

				//Load user save data
				fs.root.getDirectory(lifeOST_ROOT+"/profile",{create:false,exclusive:true},function(dir){
					dir.getFile("profile.json",null,function(fileEntry){
						fileEntry.file(function(file){
							//Read file here
							var reader = new FileReader();
							reader.onloadend=function(evt){
								save_data=evt.target.result;
							}
							reader.readAsText(file);
						},function(){
							save_data="code_null"
						});
					},function(){
						save_data="code_null"
					});
				},function(){
					save_data="code_null"
				});

			}
		}, function(){
			alert("Filesystem Connection Failure. Please restart LifeOST.")
		});


		do{
			if (save_data && save_data != "code_null"){
				var reg_list=window.JSON.parse(save_data);
				var curr_poly;
				for (var i = 0; i < reg_list.length; i++){
					curr_poly=L.polygon(reg_list[i].geo,{color:'blue'}).addTo(map);
					curr_poly.music=reg_list[i].music


					var popup="<b>Songs</b><br/><ul>";
					for (var j = 0; j < curr_poly.music.length; j++){
						popup+="<li>{0}</li>".format(curr_poly.music[j].name)
					}
					popup+="</ul>"
					curr_poly.bindPopup(popup);


					regions.push(curr_poly);

					//Set deletion eventhandler
					curr_poly.on("click",function(e){
						if (mode=="deletepolygon"){
							map.removeLayer(e.target)
							map.invalidateSize();
							regions.remove(e.target)
						}
					})
				}
			}
		} while(! save_data)


		//Initialize the editing controls
		$("#tool-pointer").click(function(e){
			mode="pointer";
			$(".btn-inverse").removeClass("active")
			$("#tool-pointer").addClass("active")
			e.preventDefault();
		})
		$("#tool-addpolygon").click(function(e){
			mode="addpolygon";
			$(".btn-inverse").removeClass("active")
			$("#tool-addpolygon").addClass("active")
			e.preventDefault();
		})
		$("#tool-finishpolygon").click(function(e){
			//Get Music Data
			selected_songs=scanSongs();
			if (selected_songs.length==0){
				alert("Please choose at least one song for this region.")
				return
			}
			
			//Repaint polygon in blue
			if (poly_vis){
				map.removeLayer(poly_vis);
				map.invalidateSize();
			}

			//Finalize Polygon
			poly_vis=L.polygon(currpoly.clone(),{color:'blue'}).addTo(map);

			poly_vis.music=selected_songs

			//Create polygon popup
			var popup="<b>Songs</b><br/><ul>";
			for (var i = 0; i < selected_songs.length; i++){
				popup+="<li>{0}</li>".format(selected_songs[i].name)
			}
			popup+="</ul>"
			poly_vis.bindPopup(popup);

			//Save Region Data
			//Save finalized polygon
			if (currpoly.length>0){
				regions.push(poly_vis)
			}

			//Set deletion eventhandler
			poly_vis.on("click",function(e){
				if (mode=="deletepolygon"){
					map.removeLayer(e.target)
					map.invalidateSize();
					regions.remove(e.target)
				}
			})
			poly_vis=false
			currpoly=[]
			resetMusicSelect()
		})
		$("#tool-deletepolygon").click(function(e){ //Pointless comment
			mode="deletepolygon"
			$(".btn-inverse").removeClass("active")
			$("#tool-deletepolygon").addClass("active")
			e.preventDefault();
		})
		$("#tool-recenter").click(function(e){ //Centers view to user's current GPS location.
			map.locate({setView: true, maxZoom: 16});
			e.preventDefault();
		})
		$("#tool-delete").click(function(e){
			regions=[];
			curr_polygon=false;
			//Don't preventDefault, so navigator follows link back to index.html
		}) 
		$("#tool-save").click(function(e){
			var save_data=create_save_JSON(regions);
			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
				fs.root.getDirectory(lifeOST_ROOT,{create:true,exclusive:false},function(dir){
					dir.getDirectory("profile",{create:true,exclusive:false},function(dir){
						dir.getFile("profile.json", {create: true, exclusive: false}, function(file){
							file.createWriter(function(writer){
								//writer.onwritend=function(){alert("Data saved!")}
								writer.write(save_data)
							},function(){
								alert("Failed to create save file writer. Please try again.")
							});
						},function(){
							alert("Failed to create save file. Please try again.")
						})
					},function(){
						alert("Failed to create Profile directory.")
					})

				},function(){
					alert("Failed to create LifeOST Root directory.")
				})
			},function(){
				alert("Filesystem Connection Failure. Please try again.")
			});
		
			e.preventDefault();
		})

		//Onclick Event for the map. Edit related.
		map.on("click",function(e){
			var lat=e.latlng.lat;
			var lng=e.latlng.lng;
			switch(mode){
				case "addpolygon":
					//Add current point to polygon.
					currpoly.push([lat,lng]);
					//Draw the polygon.
					if (poly_vis){
						map.removeLayer(poly_vis);
						map.invalidateSize();
					}
					poly_vis=L.polygon(currpoly.clone(),{color:'green'}).addTo(map);
					poly_vis.on("click",function(){
						if (mode=="deletepolygon"){
							alert("Cannot delete active polygon.")
						}
					})
					e.preventDefault();
					break;
				case "deletepolygon":
					e.preventDefault();
					break;
				case "pointer":
					break;
			}
		})
	});
});

//Class definitions and edits
function Region(polygon,playlists){
	this.polygon=polygon;
	this.playlists=playlists;
}
function Playlist(songs,time){
	this.songs=songs;
	this.time=time;
}
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
		what = a[--L];
		while ((ax = this.indexOf(what)) !== -1) {
			this.splice(ax, 1);
		}
	}
    return this;
};
Object.prototype.clone = function() {
  var newObj = (this instanceof Array) ? [] : {};
  for (i in this) {
      if (i == 'clone') continue;
      if (this[i] && typeof this[i] == "object") {
	        newObj[i] = this[i].clone();
	      } else newObj[i] = this[i]
    } return newObj;
};

String.prototype.format=function(){
    var args=arguments;
    var out=this;
    for (var i = 0; i<args.length; i++){
	        out=out.replace("{"+i+"}",args[i])
	    }
    return out
}

//Helper functions
function latlngs_to_list(l){
	var out=[]
	for (var i = 0; i<l.length; i++){
		out.push([l[i].lat,l[i].lng])
	}
	return out
}
function create_save_JSON(r){
	var out=[]
	for (var i = 0; i < r.length; i++){
		geoCoordList=latlngs_to_list(r[i]._latlngs);
		music=r[i].music;
		out.push({geo:geoCoordList,music:music});
	}
	return window.JSON.stringify(out)
}
function addSong(path){
	var name=path.split("/").slice(-1)[0]
	$("#music-container").append(SONG_DIV_TEMPLATE.format(name,path))
}
function scanSongs(){
	var out=[]
	var currname
	var currpath
	$(".music-checkbox").each(function(){
		if(this.checked){
			currname=$($(this).parent().parent().siblings()[0]).children().children().children().children().html();
			currpath=$($(this).parent().parent().siblings()[2]).children().children().children().children().html();
			out.push({name:currname,path:currpath})
		}
	})
	return out
}
function resetMusicSelect(){
	$("#music-select").find("input").each(function(){this.checked=false})
}
