# MeowPaid

MeowPaid records purchases and tracks shared spending.

## Language

**Receipt**:
A merchant-issued record of a purchase that may show the purchase date, item breakdown, and total paid.

**Receipt draft**:
A proposed transaction based on one receipt, awaiting the user's confirmation. Receipt lines with the same payment subtype contribute to a single transaction item.

**Item discount**:
A reduction applied to a specific item on the receipt. The item contributes its price after that reduction to the transaction.

**Transaction discount**:
A reduction applied to the whole purchase. It reduces the total paid for the transaction.

**Shop**:
The merchant associated with a transaction. A transaction belongs to one shop.

**Payee**:
The MeowPaid user who paid for a transaction.

**Payment subtype**:
The spending category assigned to a transaction item. Each payment subtype belongs to a payment type.

**Transaction**:
A purchase recorded for a shop and payee. Its total is the sum of its transaction items minus the transaction discount.

**Transaction item**:
A portion of a transaction amount assigned to a payment subtype.
