import { useGetCurrentERC20Allowance } from "@/hooks/use-get-current-erc20-allowance";
import type { HypercertExchangeClient } from "@hypercerts-org/marketplace-sdk";
import { useState } from "react";
import type { Address } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import type { UsePublicClientReturnType } from "wagmi";

export enum TransactionStatuses {
  PreparingOrder = "preparingOrder",
  Approval = "approval",
  SignForBuy = "signForBuy",
  Pending = "pending",
  Confirmed = "confirmed",
  Failed = "failed",
}

const useHandleBuyFraction = (
  publicClient: UsePublicClientReturnType,
  hypercertExhangeClient: HypercertExchangeClient
) => {
  const [transactionStatus, setTransactionStatus] =
    useState<keyof typeof TransactionStatuses>("Pending");
  const [transactionHash, setTransactionHash] = useState<Address | null>(null);
  const currentAllowance = useGetCurrentERC20Allowance();

  const handleBuyFraction = async (
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    order: any,
    amount: number,
    address: Address,
    hypercertId: string | undefined,
    comment: string | undefined
  ) => {
    if (!publicClient) {
      throw new Error("No public client found");
    }
    if (!order) {
      throw new Error("No order found");
    }

    const takerOrder = hypercertExhangeClient.createFractionalSaleTakerBid(
      order,
      address,
      amount,
      order.price
    );

    try {
      setTransactionStatus("Approval");
      const totalPrice = BigInt(order.price) * BigInt(amount);
      if (currentAllowance < totalPrice) {
        const approveTx = await hypercertExhangeClient.approveErc20(
          order.currency, // Be sure to set the allowance for the correct currency
          totalPrice
        );
        await waitForTransactionReceipt(publicClient, {
          hash: approveTx.hash as `0x${string}`,
        });
      }
    } catch (e) {
      console.error(e);
      setTransactionStatus("Failed");
    }

    try {
      setTransactionStatus("PreparingOrder");
      const { call } = hypercertExhangeClient.executeOrder(
        order,
        takerOrder,
        order.signature
      );
      setTransactionStatus("SignForBuy");
      const tx = await call();

      fetch("/api/contributions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          txId: tx.hash as `0x${string}`,
          hypercertId: hypercertId,
          amount: amount,
          comment: comment,
        }),
      });

      setTransactionHash(tx.hash as Address);
      setTransactionStatus("Pending");
      const txnReceipt = await waitForTransactionReceipt(publicClient, {
        hash: tx.hash as `0x${string}`,
      });
      console.log({ txnReceipt });
      setTransactionStatus("Confirmed");
      return txnReceipt;
    } catch (e) {
      console.error(e);
      setTransactionStatus("Failed");
    }
  };

  return { handleBuyFraction, transactionStatus, transactionHash };
};

export { useHandleBuyFraction };