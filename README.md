# ShareMotion – A Ride Sharing Web App

ShareMotion is a full-stack ride-sharing platform that connects passengers for shared rides, offers cost flexibility, safety features, and group contracts for regular commuters. Users can post rides, search and join available rides, manage bookings, communicate with others, and even set up recurring group contracts — all in one place.




**Live Demo:** [ShareMotion App](https://share-motion-one.vercel.app/rides)

##  Key Features

- **User Authentication:** Register, login, and logout securely.
- **Ride Posting:** Post rides with starting point, destination, date, time, available seats, and tentative price.
- **Ride Search and Discovery:** Search rides by destination and time; view all available rides in a list view.
- **Ride Requests:** Send, confirm, cancel, or view the status (`Pending`, `Confirmed`, `Cancelled`) of ride requests.
- **Price Bidding:** Bid on ride prices for fair and flexible negotiations.
- **Ride History:** View detailed information on rides you have posted or joined.
- **Recommendations:** Receive ride suggestions near your most frequently visited locations.
- **Messaging:** Communicate directly with other users within the platform.
- **Group Contracts:** Set up weekly contractual rides for groups, with automatic reposting if extra seats are available.
- **Feedback and Ratings:** Rate and provide feedback on rides and fellow users.
- **Safety Features:** One-tap SOS button for emergencies; set and notify emergency contacts.
- **Admin Tools:** Admins can monitor feedback, generate reports, warn users, and suspend or delete accounts.




##  Technologies Used

- **Language:** JavaScript  
- **Frontend:** React.js  
- **Backend:** Express.js (Node.js)  
- **Database:** MongoDB  
- **Deployment:** Vercel 




##  How to Use

1. **Sign Up / Login:** Create an account or log in via the top-right menu.  
2. **Post a Ride:** Go to **"Post Ride"**, enter ride details (locations via map, date/time, seats, price), and submit.  
3. **Search & Join Rides:** Navigate to **"Rides"**, search by location/date, and request to join suitable rides.  
4. **Manage Requests:** View and accept or decline ride requests in **"My Rides"**.  
5. **View History:** Check the **"History"** section for past rides; mark them as completed if needed.  
6. **Contracts:** Create group ride contracts under **"Contracts"** for recurring weekly rides.  
7. **Messages:** Chat with users in the **"Messages"** section.  
8. **Emergency:** Set up emergency contacts and use the **SOS** button in emergencies.  
9. **Admin Features:** (For admins) Access the dashboard to manage users, monitor alerts, and generate reports.


---

##  Installation and Running Locally

```bash
# 1. Clone the repository
git clone https://github.com/tasnubaMe/ShareMotion-a-ride-sharing-app.git

# 2. Install dependencies
# Navigate into both the client and server directories and install dependencies
npm install

# 3. Configure environment variables
# Set up your MongoDB connection URI and other variables in the server environment.

# 4. Run the server
cd server
npm start

# 5. Run the client
cd client
npm start

# 6. Access the app
# Open http://localhost:3000 in your browser


