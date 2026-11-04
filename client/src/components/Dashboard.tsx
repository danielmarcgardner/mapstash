import { AppShell } from "@mantine/core";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import AppShellComponent from "./AppShell";
import SideBar from "./SideBar";
import { useGetPlacesQuery } from "../state/api/placeApi";

const containerStyle = {
    width: "100%",
    height: "100%"
};

const center = {
    lat: 33.7501,
    lng: -84.3885
  };

const Dashboard = () => {
    const { data: places, isLoading, isSuccess, isError } = useGetPlacesQuery();


    return (
        <AppShellComponent>
            <SideBar />

            <AppShell.Main className="p-0">
                <div className="w-full h-[calc(100vh-60px)]">
                    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={center}
                            zoom={12}
                        >
                            {isLoading && <div>Loading...</div>}
                            {isError && <div>Error loading places</div>}
                            {isSuccess && places && places.map(place => (
                                <Marker
                                    key={place.id}
                                    position={{ lat: place.lat, lng: place.lng }}
                                    title={place.title}
                                />
                            ))}
                        </GoogleMap>
                    </LoadScript>
                </div>
            </AppShell.Main>
        </AppShellComponent>
    );
};

export default Dashboard;