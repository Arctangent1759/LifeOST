var OPTION_SAVE_DATA;

function load_options(onDone){
	var lifeOST_ROOT="/sdcard/Android/data/com.lifeost.lifeost";
	OPTION_SAVE_DATA="status:loading"
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,function(fs){
		fs.root.getDirectory(lifeOST_ROOT+"/options",{create:false,exclusive:true},function(dir){
			dir.getFile("options.json",null,function(fileEntry){
				var reader = new FileReader();
				reader.onloadend=function(evt){
					OPTION_SAVE_DATA=window.JSON.parse(evt.target.result);
					onDone();
				}
				reader.readAsText(fileEntry)
			},function(){OPTION_SAVE_DATA={geo_period:1000,truncate:true};onDone();});
		},function(){OPTION_SAVE_DATA={geo_period:1000,truncate:true};onDone();});
	},function(){OPTION_SAVE_DATA={geo_period:1000,truncate:true};onDone();});
}
