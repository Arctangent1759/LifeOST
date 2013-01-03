//Globals
var GLOBALS=true;
var SONG_DIV_TEMPLATE='\
<div class="music-select-entry" style="border:1px solid gray; border-radius:15px; width:98%;">\
	<table style="width:100%"><tr>\
		<td width="20%"><span style="padding-left:10px ; color:white;">{0}</span></td>\
		<td width="40%"><span style="padding-left:10px ; color:white;">{1}</span></td>\
		<td width="10%" align="center"><span style="padding-right:10px ; color:white;"><input class="music-checkbox" type="CHECKBOX"/></span></td>\
	</tr></table>\
</div>'

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

	document.addEventListener("deviceready",function(){
		navigator.geolocation.getCurrentPosition(function(){map.locate({setView: true, maxZoom: 16});},function(){alert("GPS Communication Failure.");})
		$("#tool-addpolygon").click(function(e){
			mode="addpolygon";
			$(".btn-inverse").removeClass("active")
			$("#tool-addpolygon").addClass("active")
			e.preventDefault();
		})
		$("#tool-finishpolygon").click(function(e){
			//Repaint polygon in blue
			if (poly_vis){
				map.removeLayer(poly_vis);
				map.invalidateSize();
			}
			poly_vis=L.polygon(currpoly.clone(),{color:'blue'}).addTo(map);
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
		})
		$("#tool-deletepolygon").click(function(e){
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
			//TODO:Add saving logic here.
			e.preventDefault();
		})
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
					break;
				case "deletepolygon":
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
	out=[]
	for (var i = 0; i<l.length; i++){
		out.push([l[i].lat,l[i].lng])
	}
	return out
}
function addSong(path){
	var name=path.split(".").slice(0,-1).join().split("/").slice(-1)[0]
	$("#music-container").append(SONG_DIV_TEMPLATE.format(name,path))
}
function scanSongs(){
	var out=[]
	var currname
	var currpath
	$(".music-checkbox").each(function(){
		if(this.checked){
			currname=$($(this).parent().parent().siblings()[0]).children().html();
			currpath=$($(this).parent().parent().siblings()[1]).children().html();
			out.push({name:currname,path:currpath})
		}
	})
	return out
}
