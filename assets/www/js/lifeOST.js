var DEBUG=true;
$(function(){

	//Create the map and initialize it.
	$('#map').height($('#map').width()/1.62);
	var map = L.map('map').setView([37.87632, -122.25661], 13);
	L.tileLayer('http://{s}.tile.cloudmade.com/5c532a136a6646b0b2fdfe006adaa905/997/256/{z}/{x}/{y}.png', {
		maxZoom: 18
	}).addTo(map);

	if (DEBUG){
		$('#debug').append("<h1>Debug</h1>");
		$('#debug').append("<div id='gps_data'></h1>");
	}
	document.addEventListener("deviceready",function(){
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
				alert("GPS Communication failure")
			},{maximumAge:1000,timeout:3000,enableHighAccuracy:true}
		)
	},false);
});
