import React from "react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Tabs } from "./components/ui/tabs";
import { Textarea } from "./components/ui/textarea";
// import MiniPaymentGateway from "./components/MiniPaymentGateway";
import MiniPaymentGateway from "./components/PaymentSystem/PaymentGateway1";
import { div } from "framer-motion/client";
import { Select } from "./components/ui/select";
export default function App() {
  return (
    <div>
  <MiniPaymentGateway />
  <Button />
  <Card />
  <Input />
  <Label />
  <Select />
  <Tabs />
  <Textarea />
  </div>
  );
}
