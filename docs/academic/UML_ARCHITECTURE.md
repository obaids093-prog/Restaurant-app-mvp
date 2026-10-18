# AURA: Complete UML Architecture & System Design

This document details the complete architectural design, data models, state workflows, and use case diagrams for the **AURA Restaurant Application (Modern Artisan Kitchen & Botanica)**.

---

## 1. High-Level System Architecture & Component Diagram

```mermaid
graph TD
    subgraph UI_Presentation_Layer ["Presentation Layer (React Native / Expo Screens)"]
        LoginScreen["LoginScreen<br/>(3D Flip / Form Validation)"]
        MenuScreen["MenuScreen<br/>(Debounced Search / Category Filter)"]
        CartScreen["CartScreen<br/>(Quantity Stepper / Promo Codes)"]
        OrderSummaryScreen["OrderSummaryScreen<br/>(Tax / Service / Totals)"]
        ReservationScreen["ReservationScreen<br/>(Table Slots / Pakistani Phone Format)"]
        OrderTrackingScreen["OrderTrackingScreen<br/>(Live Status Stepper 10s-20s-30s)"]
        ManagerDashboardScreen["ManagerDashboardScreen<br/>(Orders / Tables / Menu CRUD)"]
        ProfileScreen["ProfileScreen<br/>(User Info / Light-Dark Toggle)"]
    end

    subgraph State_Management_Layer ["State & Context Layer"]
        AuthContext["AuthContext<br/>(user, login, signup, logout)"]
        ThemeContext["ThemeContext<br/>(isDark, toggleTheme, colors, shadows)"]
        BranchContext["BranchContext<br/>(selectedBranch, branchId, branchCity)"]
        CartContext["CartContext + cartReducer<br/>(items, promoCode, discountPercent)"]
        OrdersContext["OrdersContext + ordersReducer<br/>(orders list, status progression)"]
        ReservationContext["ReservationContext / Hook<br/>(table booking, availability check)"]
    end

    subgraph Navigation_Layer ["Navigation Layer (React Navigation)"]
        RootStack["Root NativeStackNavigator"]
        CustomerTabs["Customer BottomTabNavigator<br/>(Menu, Cart, Reservations, Profile)"]
        ManagerTabs["Manager Operations Stack / Tabs<br/>(Orders, Reservations, Menu Management)"]
    end

    subgraph Data_Storage_Layer ["Data & Storage Layer"]
        AsyncStorage["AsyncStorage (Device Persistence)"]
        MockData["Mock Datasets (users.js, menu.js, tables.js, reservations.js)"]
    end

    RootStack --> LoginScreen
    RootStack --> CustomerTabs
    RootStack --> ManagerTabs

    CustomerTabs --> MenuScreen
    CustomerTabs --> CartScreen
    CustomerTabs --> ReservationScreen
    CustomerTabs --> ProfileScreen
    CartScreen --> OrderSummaryScreen
    OrderSummaryScreen --> OrderTrackingScreen

    LoginScreen --> AuthContext
    MenuScreen --> CartContext
    CartScreen --> CartContext
    OrderSummaryScreen --> OrdersContext
    OrderTrackingScreen --> OrdersContext
    ReservationScreen --> ReservationContext
    ManagerDashboardScreen --> OrdersContext
    ManagerDashboardScreen --> ReservationContext

    AuthContext --> AsyncStorage
    ThemeContext --> AsyncStorage
    OrdersContext --> AsyncStorage
    ReservationContext --> AsyncStorage
```

---

## 2. UML Class / Data Model Diagram

```mermaid
classDiagram
    class User {
        +String id
        +String name
        +String email
        +String password
        +String role ("customer" | "manager")
        +String phone
        +String avatar
    }

    class MenuItem {
        +String id
        +String name
        +String description
        +Float price
        +String category ("Starters" | "Mains" | "Desserts" | "Drinks")
        +String image
        +Boolean isSpecial
        +Boolean isAvailable
        +String prepTime
        +Float rating
    }

    class CartItem {
        +MenuItem menuItem
        +Integer quantity
        +String specialInstructions
        +Float getLineTotal()
    }

    class CartState {
        +List~CartItem~ items
        +String promoCode
        +Float discountPercent
        +Float getSubtotal()
        +Float getServiceCharge()
        +Float getSalesTax()
        +Float getGrandTotal()
    }

    class DiningTable {
        +String id
        +String tableNumber
        +Integer capacity (2, 4, 6, 8, 12)
        +String location ("Indoor Main", "Patio", "Rooftop VIP")
        +Boolean isOccupied
    }

    class Reservation {
        +String id
        +String customerId
        +String customerName
        +String phone
        +String date
        +String timeSlot ("12:00" - "22:00")
        +Integer partySize
        +String tableId
        +String branchId
        +String branchName
        +String branchCity
        +String status ("Confirmed" | "Cancelled" | "Declined" | "Completed")
    }

    class Order {
        +String id
        +String customerId
        +String customerName
        +String orderType ("Dine-in" | "Takeaway")
        +String tableNumber
        +String pickupTime
        +List~CartItem~ items
        +Float grandTotal
        +String branchId
        +String branchName
        +String branchCity
        +String status ("Pending" | "Preparing" | "Ready" | "Served" | "Cancelled")
        +Integer elapsedSeconds
        +String timestamp
    }

    User "1" -- "0..*" Order : places
    User "1" -- "0..*" Reservation : books
    CartState "1" *-- "0..*" CartItem : contains
    CartItem o-- "1" MenuItem : references
    Order "1" *-- "1..*" CartItem : contains
    Reservation "0..*" -- "1" DiningTable : assigns
```

---

## 3. Use Case Diagram (Customer vs. Manager)

```mermaid
flowchart LR
    subgraph Actors
        Customer((Customer))
        Manager((Manager))
    end

    subgraph Authentication_Module ["Authentication & Profile"]
        UC1[Sign In / Sign Up]
        UC2[Toggle Light / Dark Theme]
        UC3[Manage Profile Details]
    end

    subgraph Customer_Dining_Experience ["Customer Dining Experience"]
        UC4[Browse Menu with Category Chips]
        UC5[Search Dishes with Debounce]
        UC6[Favorite Dishes Heart Toggle]
        UC7[Customize Cart & Special Notes]
        UC8[Apply Discount Promo Codes]
        UC9[Select Dine-In Table / Takeaway Time]
        UC10[Reserve Dining Table with Phone Verification]
        UC11[Track Live Order Status Timeline]
    end

    subgraph Manager_Operations ["Manager Kitchen & Operations"]
        UC12[View Incoming Kitchen Orders Queue]
        UC13[Manually Advance Order Statuses]
        UC14[Accept / Decline Table Bookings]
        UC15[Live Menu CRUD: Add Item / Edit Price / Toggle Availability]
    end

    Customer --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Customer --> UC6
    Customer --> UC7
    Customer --> UC8
    Customer --> UC9
    Customer --> UC10
    Customer --> UC11

    Manager --> UC1
    Manager --> UC2
    Manager --> UC12
    Manager --> UC13
    Manager --> UC14
    Manager --> UC15
```

---

## 4. Sequence Diagram: Order Placement & Kitchen Fulfillment

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer
    participant UI as CartScreen / OrderSummaryScreen
    participant CartCtx as CartContext (cartReducer)
    participant OrderCtx as OrdersContext (ordersReducer)
    participant Storage as AsyncStorage
    actor Manager as Kitchen Manager

    Customer->>UI: Reviews Cart (Items, Special Notes, Promo Code)
    Customer->>UI: Selects Order Type (Dine-in with Table OR Takeaway)
    Customer->>UI: Taps "Confirm & Place Order"
    UI->>OrderCtx: dispatch({ type: 'CREATE_ORDER', payload: orderPayload })
    OrderCtx->>Storage: Persist Updated Orders List
    OrderCtx-->>UI: Returns New Order ID (e.g., #ORD-8492)
    UI->>CartCtx: dispatch({ type: 'CLEAR_CART' })
    UI->>Customer: Navigate to OrderTrackingScreen (#ORD-8492)

    par Order Status Progression (Automated Interval & Manual Override)
        OrderCtx->>OrderCtx: Timer advances (Pending -> Preparing -> Ready -> Served)
        OrderCtx-->>UI: Realtime step progress updates
    and Kitchen Manager Dashboard Sync
        Manager->>OrderCtx: Views Order in Kitchen Queue
        Manager->>OrderCtx: Can manually tap "Advance to Ready / Served"
        OrderCtx->>Storage: Persists Status Change
    end
```

---

## 5. State Transition Diagram: Order Lifecycle & Kitchen Pipeline

```mermaid
stateDiagram-v2
    [*] --> Pending : Customer Places Order
    Pending --> Preparing : Auto-advance (10s) OR Kitchen starts prep
    Preparing --> Ready : Auto-advance (20s) OR Chef marks cooked
    Ready --> Served : Auto-advance (30s) OR Waiter delivers to table
    Served --> [*] : Order Completed

    Pending --> Cancelled : Customer / Manager Cancels
    Preparing --> Cancelled : Emergency Kitchen Cancel
    Cancelled --> [*]
```
