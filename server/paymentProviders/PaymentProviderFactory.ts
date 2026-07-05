import { PaymentProvider } from "./PaymentProvider.ts";
import { SaweriaProvider } from "./SaweriaProvider.ts";

export class PaymentProviderFactory {
  static getProvider(name: string): PaymentProvider {
    switch (name.toLowerCase()) {
      case 'saweria':
        return new SaweriaProvider();
      // Future providers can be added here
      // case 'midtrans': return new MidtransProvider();
      // case 'tripay': return new TripayProvider();
      default:
        console.warn(`[PaymentProviderFactory] Provider ${name} not found, falling back to saweria.`);
        return new SaweriaProvider();
    }
  }
}
