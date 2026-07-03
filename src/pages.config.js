/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import About from './pages/About';
import Agenda from './pages/Agenda';
import Banks from './pages/Banks';
import CashRegister from './pages/CashRegister';
import ClientProfile from './pages/ClientProfile';
import Clients from './pages/Clients';
import CustomerSupport from './pages/CustomerSupport';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Features from './pages/Features';
import Financials from './pages/Financials';
import GmailCallback from './pages/GmailCallback';
import GmailOAuthCallback from './pages/GmailOAuthCallback';
import Home from './pages/Home';
import Invoices from './pages/Invoices';
import Landing from './pages/Landing';
import Messages from './pages/Messages';
import Onboarding from './pages/Onboarding';
import Plans from './pages/Plans';
import Profile from './pages/Profile';
import Receipts from './pages/Receipts';
import Register from './pages/Register';
import Reports from './pages/Reports';
import Services from './pages/Services';
import Stock from './pages/Stock';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import WorkspaceSettings from './pages/WorkspaceSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Agenda": Agenda,
    "Banks": Banks,
    "CashRegister": CashRegister,
    "ClientProfile": ClientProfile,
    "Clients": Clients,
    "CustomerSupport": CustomerSupport,
    "Dashboard": Dashboard,
    "Documents": Documents,
    "Features": Features,
    "Financials": Financials,
    "GmailCallback": GmailCallback,
    "GmailOAuthCallback": GmailOAuthCallback,
    "Home": Home,
    "Invoices": Invoices,
    "Landing": Landing,
    "Messages": Messages,
    "Onboarding": Onboarding,
    "Plans": Plans,
    "Profile": Profile,
    "Receipts": Receipts,
    "Register": Register,
    "Reports": Reports,
    "Services": Services,
    "Stock": Stock,
    "Tasks": Tasks,
    "Team": Team,
    "WorkspaceSettings": WorkspaceSettings,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};