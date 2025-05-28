# PlayForFun - Match Winner Prediction Website 🏏✨

Welcome to PlayForFun! This is a private IPL (Indian Premier League) prediction game designed for families and small groups to engage in friendly competition throughout the cricket season.

## About The Project

PlayForFun allows a designated "Space Admin" to create a private prediction league (a "Space"). The admin can then invite members (family, friends) using a unique Join Code. Within their space, users can predict the winners of upcoming IPL matches before a set deadline. After matches conclude, the admin enters the official results, and the system automatically calculates points for all participants based on their predictions.

The goal is to provide a simple, fun, and engaging platform focused on the joy of the game and friendly rivalry, without the complexities of typical betting applications.

**Co-created with passion by Shaik Mohammed Ashraf & his AI Friend.**

## Live Application

*   **Frontend URL:** [https://play-for-fun.vercel.app](https://play-for-fun.vercel.app)

## Features (Version 1.0)

**User Features:**
*   Join a private "Space" using a unique Join Code.
*   Create a user account within a Space with a username and password.
*   Login to their Space.
*   View a schedule of upcoming and past IPL matches for their Space.
*   Submit predictions for the winning team before the match's prediction deadline.
*   Update their predictions before the deadline.
*   View match results (winner or drawn) after entered by the admin.
*   View a prediction summary for completed matches (who predicted which team).
*   View Weekly and Overall Leaderboards for their Space.
*   Secure Logout.

**Admin Features (within their own Space):**
*   Create a new private "Space" with a system-generated unique Join Code and a private admin password.
*   Admin Login to their Space.
*   **Match Management:**
    *   Add new IPL matches (Team A, Team B, Match Date, Match Time).
    *   Manually set a specific Prediction Deadline (Date & Time) for each match.
    *   Optionally add IPL Week Number and Match Number for context.
    *   Edit existing match details.
    *   Delete matches.
*   **Result Management:**
    *   Enter match results (Winning Team or Mark as "Match Drawn / No Result").
    *   Trigger automatic point calculation for all users in the Space based on results.
    *   Clear a previously entered result (which also reverts points awarded for that match).
*   **Score Management:**
    *   Manually edit/override a user's `overall_total_points`.
*   View all user-facing pages (Matches, Leaderboards, etc.) within their Space.

**Scoring System:**
*   Correct Prediction: +2 points
*   Wrong Prediction: -1 point
*   No Prediction Submitted by Deadline: -1 point
*   Match Drawn / No Result: 0 points for all users for that match.

## Technology Stack

*   **Frontend:** Next.js (App Router), React.js, Tailwind CSS, Axios
*   **Backend:** Node.js, Express.js
*   **Database:** MySQL (Cloud-hosted on Railway.app)
*   **Authentication:** JWT (JSON Web Tokens) stored in HttpOnly cookies.
*   **Deployment:** Vercel (for both Frontend and Backend serverless functions).

## Local Development Setup

**Prerequisites:**
*   Node.js (v18.x or later recommended)
*   npm or yarn
*   A MySQL server instance (local or cloud for development)
*   Git

**Backend Setup:**
1.  Navigate to the `backend` directory: `cd backend`
2.  Install dependencies: `npm install`
3.  Create a `.env` file by copying `.env.example` (if you create one) or manually set the following:
    *   `PORT` (e.g., 5001)
    *   `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` (for your MySQL instance)
    *   `JWT_SECRET` (a long, random string)
    *   `JWT_EXPIRES_IN` (e.g., 1h)
    *   `FRONTEND_URL` (e.g., http://localhost:3000 for local dev)
4.  Set up your MySQL database with the required schema (see SQL scripts used during development).
5.  Run the backend server: `npm run server` (for development with nodemon) or `npm start`.

**Frontend Setup:**
1.  Navigate to the `frontend` directory: `cd frontend`
2.  Install dependencies: `npm install`
3.  Create a `.env.local` file and set:
    *   `NEXT_PUBLIC_API_URL` (e.g., http://localhost:5001/api if backend is running locally)
4.  Run the frontend development server: `npm run dev`.
5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contact

Created by **Shaik Mohammed Ashraf**.
For questions, suggestions, or issues, please refer to the FAQ & Contact page on the website or email: [smdashraf01@gmail.com](mailto:smdashraf01@gmail.com)

---

Feel free to reach out if you have any questions about this project!
