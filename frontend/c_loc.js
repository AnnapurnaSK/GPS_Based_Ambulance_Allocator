async function getCurrentCoordinates(){
    if (!navigator.geolocation){
        throw new Error("Geolocation is not supported by this browser");
    }

    const position=await new Promise((resolve, reject)=>{
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    return{
        lat: position.coords.latitude,
        lon: position.coords.longitude
    };
}