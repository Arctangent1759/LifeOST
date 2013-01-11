var lifeOST_ROOT="/sdcard/Android/data/com.lifeost.lifeost";
$(function(){
	document.addEventListener("deviceready",function(){
		//Define saving
		function save_options(json_data){
			if (json_data){
				window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
					fs.root.getDirectory(lifeOST_ROOT,{create:true,exclusive:false},function(dir){
						dir.getDirectory("options",{create:true,exclusive:false},function(dir){
							dir.getFile("options.json", {create: true, exclusive: false}, function(file){
								file.createWriter(function(writer){
									writer.write(window.JSON.stringify(json_data))
								});
							})
						});
					});
				});
				return true
			}
			return false
		}
		function create_save_object(){
			var out={};
			out.geo_period=Number($("#geo_period")[0].value)
			if (! out.geo_period || out.geo_period < 0){
				alert("Invalid Geolocation Interval");
				return false;
			}
			out.truncate=$("#truncate")[0].checked;
			return out;
		}

		//Load Option Data
		load_options(function(){
			$("#geo_period")[0].value=OPTION_SAVE_DATA.geo_period;
			$("#truncate")[0].checked=OPTION_SAVE_DATA.truncate;
		});

		//Populate Controls
		$("#savebtn").click(function(e){
			if (! save_options(create_save_object())){
				e.preventDefault();
			}
		})
		$("#applybtn").click(function(e){
			save_options(create_save_object());
			e.preventDefault();
		})
		$("#cancelbtn").click(function(e){
			//Pointless Comment
		})
	});
});
