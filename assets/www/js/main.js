var DEBUG=false;
var lifeOST_ROOT="/sdcard/Android/data/com.lifeost.lifeost";
$(function(){

	//Create the map and initialize it.
	$('#map').height($('#map').width()/1.62);
	var map = L.map('map').setView([37.87632, -122.25661], 13);
	L.tileLayer('http://{s}.tile.cloudmade.com/5c532a136a6646b0b2fdfe006adaa905/997/256/{z}/{x}/{y}.png', {
		maxZoom: 18
	}).addTo(map);
	
	//Add map marker dot
	$('#map').append("<img style='position: absolute; top: 50%; left: 50%;' src='img/dot.png'></img>")

	if (DEBUG){
		$('#debug').append("<h1>Debug</h1>");
		$('#debug').append("<div id='gps_data'></h1>");
	}
	document.addEventListener("deviceready",function(){
		//Use navigator's follow link instead of browser follow link
		$(".btn").each(
			function(index,value){
				$(value).click(
					function(e){
						navigator.app.loadUrl(value.href)
						e.preventDefault();
					}
				);
			}
		);
		//Load data
		window.requestFileSystem(LocalFileSystem.PERSISTENT,0,function(fs){
			fs.root.getDirectory(lifeOST_ROOT+"/profile",{create:false,exclusive:true},function(dir){
				dir.getFile("profile.json",null,function(fileEntry){
					fileEntry.file(function(file){
						//Read file here
						var reader = new FileReader();
						reader.onloadend=function(evt){
							var save_data=window.JSON.parse(evt.target.result);
							var curr_poly;
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
						}
						reader.readAsText(file);
					},function(){
						//Profile doesn't exist yet. Don't do anything.
					});
				},function(){
					//Profile doesn't exist yet. Don't do anything.
				})
			},function(){
				//Profile doesn't exist yet. Don't do anything.
			})
		},function(){
			alert("Filesystem connection failure.")
		});

		//Load options
		load_options(function(){

		
			//Position logic
			navigator.geolocation.watchPosition(
				function(position){
					if (DEBUG){
						$("#gps_data").html(
							'Latitude: '+position.coords.latitude+"<br/>"+
							'Longitude: '+position.coords.longitude
						)
					}
					map.locate({setView: true, maxZoom: 16});
				},function(){
					//TODO: On toast update, add 'waiting for GPS' toast.
				},{maximumAge:OPTION_SAVE_DATA.geo_period,timeout:20000,enableHighAccuracy:true}
			)
		});
	},false);
});
