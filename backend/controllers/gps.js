
//Function to find the nearest distance and time it take to navigate from 1 coordinat t othe cordinate
async function navigate(lat1, lon1, lat2, lon2)
{
    try
    {
        if(!validate(lat1,lon1) || !validate(lat2,lon2))
        {
            return{
                status: false
            }
        }
        else
        {
            //Open source routing machine API
            const url=`https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
            const result=await fetch(url);
            const data=await result.json();
            if(data.code!=="Ok")
            {
                return {
                    status: false
                }
            }
            else
            {
                const r=data.routes[0];
                return {
                    status: true,
                    distance: (r.distance/1000),
                    duration: (r.duration/3600)
                }
            }
        }              
    }
    catch(err)
    {
        return {
            status: false
        }
    }
    
}

//To verif the lat and lon
function validate(lat,lon)
{
    if(typeof lat!=='number' || typeof lon!=='number')
        return false;

    if(lat<-90 || lat>90)
        return false;

    if(lon<-180 || lon>180)
        return false;

    return true;
}


//Testing
navigate(14.47744, 75.90188, 14.4774391, 75.9018759)
    .then(res => console.log(res))
    .catch(err => console.error(err));
//{ status: true, distance: 0.0004, duration: 0.00002777777777777778 } 