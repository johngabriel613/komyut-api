import { openDb, getStopsAsGeoJSON, getRoutes } from "gtfs";
import config from "../config/gtfs.config.js";

const db = openDb(config)

const getAllRoutes = async(req, res) => {
  try {
    const routes = getRoutes({},[['route_id'],['agency_id'],['route_short_name'],['route_long_name'],['route_desc'],['route_type']],[['route_long_name', 'ASC']]);

    if(!routes) return res.json("No routes available");

    return res.status(200).json(routes);
  } catch (error) {
    throw error
  }
}

const getRoutesById = async(req, res) => {
  
  const calculateCenter = (stops) => {
    let totalLat = 0;
    let totalLong = 0;

    stops.map(stop => {
      totalLat += stop.coordinates[1]
      totalLong += stop.coordinates[0]
    })

    const avgLong = totalLong / stops.length;
    const avgLat = totalLat / stops.length;

    return [avgLong, avgLat];
  }

  const getRouteType= (route) => {
    if(route[0]?.route_type == 1){
      return "BUS"
    }
    if(route[0]?.route_type == 2){
      return "TRAIN"
    }
    if (route[0]?.route_type === 3) {
      if (/PUJ/.test(route[0].route_id)) {
        return "JEEP";
      }
      return "BUS";
    }
  }

  try {
    const {id} = req.params; 

    //get stops info and return only needed data
    const stops = getStopsAsGeoJSON({route_id: id})
    const filteredStops = await stops.features.map(stop => {
      const {stop_id, stop_name} = stop.properties
      const {coordinates} = stop.geometry

      return {stop_id: stop_id, stop_name: stop_name, coordinates}
    })

    //get route info and return only needed data
    const route = getRoutes({route_id: id},['route_id', 'route_short_name', 'route_long_name', 'route_desc' , 'route_type'])
    const routeType = getRouteType(route)

    //calculate all the coordinates of stop to get the center
    const center = calculateCenter(filteredStops)
    
    return res.json({
                    ...route[0], 
                    route_type: routeType, 
                    stops: filteredStops, 
                    center
                  })
    
  } catch (error) {
    throw error
  }
}

const searchRoute = async(req, res) => {
  const {q} = req.query

  try {
    const routes = getRoutes({},[['route_id'],['agency_id'],['route_short_name'],['route_long_name'],['route_desc'],['route_type']],[['route_long_name', 'ASC']]);

    const results = routes.filter(item => {
      const longName = item.route_long_name || '';
      const desc = item.route_desc || '';
    
      return longName.toLowerCase().includes(q.toLowerCase()) || desc.toLowerCase().includes(q.toLowerCase());
    });

    if(!results) res.status(200).json('no route matches')

    return res.status(200).json(results)
  } catch (error) {
    throw error
  }
}

export default {getAllRoutes, getRoutesById, searchRoute};