import test from "node:test";
import assert from "node:assert/strict";
import { cartReducer, cleanCart, cartTotal } from "../src/cart/cart.js";
import { cars } from "../src/data/cars.js";
const design = {paint:'#ff6534', finish:'Matte', design:'Heritage', accent:'#ffffff', wheels:'#b9bec7', tint:60};
test('add, merge quantities, remove, and clear', () => {
 let items = cartReducer([], {type:'add',carId:1});
 items = cartReducer(items, {type:'add',carId:1});
 assert.equal(items.length,1); assert.equal(items[0].quantity,2);
 assert.equal(cartTotal(items),cars[0].price * 2);
 items = cartReducer(items,{type:'quantity',key:items[0].key,quantity:4});
 assert.equal(cartTotal(items),cars[0].price * 4);
 assert.deepEqual(cartReducer(items,{type:'remove',key:items[0].key}),[]);
 assert.deepEqual(cartReducer(items,{type:'clear'}),[]);
});
test('custom designs are distinct snapshots and survive storage roundtrip', () => {
 let items=cartReducer([],{type:'add',carId:1,design});
 design.paint='#18785f';
 assert.equal(items[0].design.paint,'#ff6534');
 items=cartReducer(items,{type:'add',carId:1,design});
 items=cartReducer(items,{type:'add',carId:1});
 assert.equal(items.length,3);
 assert.deepEqual(cleanCart(JSON.parse(JSON.stringify(items))),items);
});
test('invalid storage and quantities are safely normalized; catalog determines price', () => {
 assert.deepEqual(cleanCart([{carId:999,quantity:1},null,{carId:1,quantity:-1}]),[]);
 const items=cleanCart([{carId:1,quantity:999,price:1}]);
 assert.equal(items[0].quantity,10); assert.equal(cartTotal(items),cars[0].price*10);
 assert.equal(cartReducer(items,{type:'quantity',key:items[0].key,quantity:0})[0].quantity,1);
 assert.deepEqual(cleanCart({}),[]);
});
