//Sample points for testing

const points=[
    {
        name: "Point A",
        lan: 14.45437,
        lon: 75.91907,
        addess: "X area, 10st floor, near bus stop, Mangalore",
        contact: 1234567890
    },
    {
        name: "Point B",
        lan: 14.47509,
        lon: 75.92028,
        addess: "Y road, near food mart, Mangalore",
        contact: 1234567890
    },
    {
        name: "Point C",
        lan: 14.48501,
        lon: 75.90384,
        addess: "ABC markets, 1st cross, Mangalore",
        contact: 1234567890
    },
    {
        name: "Point D",
        lan: 14.45158,
        lon: 75.93433,
        addess: "# 1234 Jaya bagar davangere, Mangalore",
        contact: 1234567890
    },
    {
        name: "Point E",
        lan: 14.4515844,
        lon:  75.9343272,
        addess: "X markets, 1st floor, Vrinda nagar, Mangalore",
        contact: 1234567890
    },
]




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

async function search(lat,lon)
{
    let distance=[];
    let duration=[];
    for(let i=0;i<points.length;i++)
    {
        let res=await navigate(lat,lon,points[i].lan,points[i].lon);
        if(!res.status)
        {
            return {
                status: false
            }
        }
        distance.push(res.distance);
        duration.push(res.duration);
    }

    let min_time=Math.min(...duration);
    let point=duration.indexOf(min_time);
    return {
        Time: min_time,
        Distance: distance[point],
        details :points[point]
    };
}


//Testing
// navigate(14.47744, 75.90188, 14.4774391, 75.9018759)
//     .then(res => console.log(res))
//     .catch(err => console.error(err));
//{ status: true, distance: 0.0004, duration: 0.00002777777777777778 } 

search(14.46751, 75.92090)
.then((res)=>{console.log(res);
})
.catch(err=>console.log(err));