
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
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            try {
                const result = await fetch(url, { signal: controller.signal });
                const data = await result.json();
                clearTimeout(timeout);

                if(data.code!=="Ok")
                {
                    return { status: false }
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
            } catch (fetchErr) {
                console.error(`OSRM Fetch Error: ${fetchErr.message}`);
                return { status: false };
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

module.exports = { navigate };
//{ status: true, distance: 0.0004, duration: 0.00002777777777777778 } 