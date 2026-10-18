# AURA: UML Architectural Diagrams (A1 Deliverables)

This folder contains the complete visual models for the **AURA Restaurant App MVP (Modern Artisan Kitchen & Botanica)**, fulfilling all specifications of **Question 2** in `A1-FA2026.docx`.

---

## 1. Summary of Diagrams

| Diagram # | Diagram Type | System Scope & Relationships | Status |
|---|---|---|---|
| **1** | **Use Case Diagram** | Customer & Restaurant Manager actors, 12+ use cases (`<<include>>`, `<<extend>>`) | Available below & in `view_diagrams.html` |
| **2** | **Class Diagram** | `User`, `Customer`, `Manager`, `Category`, `MenuItem`, `Cart`, `CartItem`, `Order`, `Reservation`, `Table` | Available below & in `view_diagrams.html` |
| **3** | **Sequence Diagram** | Chronological flow: "Customer places an order" (Add to Cart ➔ Order Tracking) | Available below & in `view_diagrams.html` |
| **4** | **State Machine Diagram** | Order lifecycle transitions (`Pending` ➔ `Preparing` ➔ `Ready` ➔ `Served` / `Cancelled`) | Available below & in `view_diagrams.html` |
| **5** | **Component Diagram** | React Native architecture: Screens, Context Providers, Reducers, Hooks | Available below & in `view_diagrams.html` |

*(An interactive HTML visualizer with 1-click SVG/PNG export is provided in [`view_diagrams.html`](view_diagrams.html)).*

---

## Diagram 1: Use Case Diagram

```mermaid
graph LR
    subgraph System_Boundary ["AURA Restaurant System"]
        UC1(["Browse Menu & Specials"])
        UC2(["Search & Filter Dishes"])
        UC3(["Add Item to Cart"])
        UC4(["Customize Item Notes"])
        UC5(["Apply Promo Voucher"])
        UC6(["Reserve Dining Table"])
        UC7(["Cancel Reservation"])
        UC8(["Place Order"])
        UC9(["Track Live Order Progress"])
        UC10(["Toggle App Theme"])
        UC11(["Manage Incoming Orders"])
        UC12(["Review & Action Reservations"])
        UC13(["Update Menu Prices & Availability"])
        UC14(["Calculate Totals & Taxes"])

        UC8 -.->|"<<include>>"| UC14
        UC8 -.->|"<<extend>>"| UC5
        UC3 -.->|"<<extend>>"| UC4
    end

    Customer((Customer / Diner)) --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC6
    Customer --> UC7
    Customer --> UC8
    Customer --> UC9
    Customer --> UC10

    Manager((Restaurant Manager)) --> UC11
    Manager --> UC12
    Manager --> UC13
    Manager --> UC10
```

---

## Diagram 2: Class Diagram

```mermaid
classDiagram
    class User {
        +String id
        +String name
        +String email
        +String password
        +String role
        +String phone
        +String avatar
        +login(email, pass)
        +logout()
    }

    class Customer {
        +String address
        +placeOrder()
        +bookTable()
    }

    class Manager {
        +String employeeBadge
        +updateOrderStatus()
        +approveReservation()
        +editMenuItem()
    }

    class Category {
        +String id
        +String name
        +String icon
    }

    class MenuItem {
        +String id
        +String name
        +String description
        +Float price
        +String category
        +String image
        +Boolean isSpecial
        +Boolean isAvailable
        +String prepTime
        +Float rating
    }

    class CartItem {
        +MenuItem menuItem
        +Integer quantity
        +String note
        +Float getLineTotal()
    }

    class Cart {
        +List~CartItem~ items
        +String promoCode
        +Float discountPercent
        +addItem(item)
        +removeItem(id)
        +calculateSubtotal()
    }

    class Order {
        +String id
        +String userId
        +List~CartItem~ items
        +Float subtotal
        +Float serviceCharge
        +Float tax
        +Float discount
        +Float total
        +String orderType
        +String status
        +String timestamp
        +advanceStatus()
    }

    class Table {
        +String id
        +Integer number
        +Integer capacity
        +String location
        +Boolean isOccupied
    }

    class Reservation {
        +String id
        +String customerName
        +String customerPhone
        +Integer partySize
        +String date
        +String timeSlot
        +String tableId
        +String status
        +confirm()
        +cancel()
    }

    User <|-- Customer
    User <|-- Manager
    Customer "1" *-- "1" Cart : possesses
    Cart "1" *-- "0..*" CartItem : contains
    CartItem "1" o-- "1" MenuItem : references
    Category "1" *-- "1..*" MenuItem : organizes
    Customer "1" --> "0..*" Order : places
    Order "1" o-- "0..1" Table : assigns
    Customer "1" --> "0..*" Reservation : schedules
    Table "1" <-- "0..*" Reservation : allocated for
```

---

## Diagram 3: Sequence Diagram (Customer Places an Order)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Diner (Customer)
    participant Menu as MenuScreen
    participant Card as MenuItemCard
    participant Cart as CartScreen
    participant Reducer as cartReducer
    participant Summary as OrderSummaryScreen
    participant OrdersCtx as OrdersContext
    participant Tracking as OrderTrackingScreen

    Customer->>Menu: Browse Menu Catalog
    Menu->>Card: Render Item (Angus Tenderloin)
    Customer->>Card: Tap "Add to Cart"
    Card->>Reducer: dispatch({ type: 'ADD_ITEM', payload: item })
    Reducer-->>Cart: State updated (items: [Angus Tenderloin x 1])
    
    Customer->>Cart: View Cart Tray
    Customer->>Cart: Enter Note ("Medium Rare") & Promo ("WELCOME10")
    Cart->>Reducer: dispatch({ type: 'APPLY_PROMO', payload: 'WELCOME10' })
    Customer->>Cart: Tap "Proceed to Checkout"
    Cart->>Summary: Navigate to OrderSummaryScreen

    Customer->>Summary: Select "Dine-in" & Table A-01
    Customer->>Summary: Tap "Confirm & Place Order"
    Summary->>OrdersCtx: createOrder({ items, total, type: 'dine-in', table: 'A-01' })
    OrdersCtx-->>OrdersCtx: Store order with status "Pending" & timestamp
    OrdersCtx->>Reducer: dispatch({ type: 'CLEAR_CART' })
    Summary->>Tracking: Navigate to OrderTrackingScreen
    
    Tracking->>Tracking: Start 1s Elapsed Timer
    Note over Tracking: Auto-progression: 10s -> Preparing, 20s -> Ready, 30s -> Served
    Tracking-->>Customer: Display Live Kitchen Progression
```

---

## Diagram 4: State Machine Diagram (Order Lifecycle)

```mermaid
stateDiagram-v2
    [*] --> Pending : Customer confirms checkout (Order Dispatched)
    
    Pending --> Preparing : After 10s (Auto Timer) OR Manager manual click
    Pending --> Cancelled : Customer/Manager cancels order within 5s
    
    Preparing --> Ready : After 20s (Auto Timer) OR Chef marks dish ready
    
    Ready --> Served : After 30s (Auto Timer) OR Waiter delivers to table
    
    Served --> [*] : Order completed and archived
    Cancelled --> [*] : Order voided
```

---

## Diagram 5: Component & Context Architecture Diagram

```mermaid
graph TD
    subgraph UI_Screens ["Presentation Layer (Screens & Components)"]
        LoginScreen["LoginScreen (3D Flip / Form Validation)"]
        MenuScreen["MenuScreen (Debounced Search / Filter / Sort)"]
        MenuItemCard["MenuItemCard (React.memo Optimized)"]
        CartScreen["CartScreen (Quantity Stepper / Promo Input)"]
        OrderSummaryScreen["OrderSummaryScreen (Financial Totals)"]
        ReservationScreen["ReservationScreen (Table Slot Matrix)"]
        OrderTrackingScreen["OrderTrackingScreen (Live Timer & Stepper)"]
        ManagerDashboardScreen["ManagerDashboardScreen (Operations Console)"]
        ProfileScreen["ProfileScreen (Dark/Light Switch & Logout)"]
    end

    subgraph Context_Layer ["State & Business Logic Layer (Contexts & Reducers)"]
        ThemeProvider["ThemeProvider (useTheme)"]
        AuthProvider["AuthProvider (useAuth)"]
        MenuProvider["MenuProvider (useMenu)"]
        CartProvider["CartProvider + cartReducer (useCart)"]
        OrdersProvider["OrdersProvider (useOrders)"]
        useReservationHook["useReservation Custom Hook"]
        useDebounceHook["useDebounce Custom Hook"]
        useFormHook["useForm Custom Hook"]
    end

    subgraph Storage_Layer ["Persistence Layer"]
        safeStorage["safeStorage (AsyncStorage + Memory Fallback)"]
    end

    MenuScreen --> MenuItemCard
    MenuScreen --> useDebounceHook
    ReservationScreen --> useReservationHook
    LoginScreen --> useFormHook

    MenuScreen --> MenuProvider
    MenuScreen --> CartProvider
    CartScreen --> CartProvider
    OrderSummaryScreen --> CartProvider
    OrderSummaryScreen --> OrdersProvider
    OrderTrackingScreen --> OrdersProvider
    ManagerDashboardScreen --> OrdersProvider
    ManagerDashboardScreen --> MenuProvider
    ProfileScreen --> AuthProvider
    ProfileScreen --> ThemeProvider
    LoginScreen --> AuthProvider

    AuthProvider --> safeStorage
    ThemeProvider --> safeStorage
    OrdersProvider --> safeStorage
    MenuProvider --> safeStorage
    useReservationHook --> safeStorage
```
