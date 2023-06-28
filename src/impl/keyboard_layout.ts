import { KeyboardLayout } from "../core/keyboard_layout";
import { VirtualKey, VirtualKeys } from "./virtual_key";

export class DefaultKeyboard implements KeyboardLayout<VirtualKey> {
  replaceKey(virtualKey: VirtualKey): VirtualKey {
    return virtualKey;
  }
}

/*
1 2 3 4 5 6 7 8 9 0 - ^ ¥
q w e r t y u i o p @ [
a s d f g h j k l ; : ]
z x c v b n m , . / _

! " # $ % & ' ( ) 0 = ~ |
Q W E R T Y U I O P ` {
A S D F G H J K L + * }
Z X C V B N M < > ? _
*/
export class QwertyJISToDvorakKeyboard implements KeyboardLayout<VirtualKey> {
  replaceKey(virtualKey: VirtualKey): VirtualKey {
    switch (virtualKey) {
      case VirtualKeys.Q:
        return VirtualKeys.Quote;
      case VirtualKeys.W:
        return VirtualKeys.Comma;
      case VirtualKeys.E:
        return VirtualKeys.Period;
      case VirtualKeys.R:
        return VirtualKeys.P;
      case VirtualKeys.T:
        return VirtualKeys.Y;
      case VirtualKeys.Y:
        return VirtualKeys.F;
      case VirtualKeys.U:
        return VirtualKeys.G;
      case VirtualKeys.I:
        return VirtualKeys.C;
      case VirtualKeys.O:
        return VirtualKeys.R;
      case VirtualKeys.P:
        return VirtualKeys.L;
      case VirtualKeys.BracketLeft:
        return VirtualKeys.Slash;
      case VirtualKeys.BracketRight:
        return VirtualKeys.Equal;
      case VirtualKeys.A:
        return VirtualKeys.A;
      case VirtualKeys.S:
        return VirtualKeys.O;
      case VirtualKeys.D:
        return VirtualKeys.E;
      case VirtualKeys.F:
        return VirtualKeys.U;
      case VirtualKeys.G:
        return VirtualKeys.I;
      case VirtualKeys.H:
        return VirtualKeys.D;
      case VirtualKeys.J:
        return VirtualKeys.H;
      case VirtualKeys.K:
        return VirtualKeys.T;
      case VirtualKeys.L:
        return VirtualKeys.N;
      case VirtualKeys.Semicolon:
        return VirtualKeys.S;
      case VirtualKeys.Quote:
        return VirtualKeys.Minus;
      case VirtualKeys.Z:
        return VirtualKeys.Semicolon;
      case VirtualKeys.X:
        return VirtualKeys.Q;
      case VirtualKeys.C:
        return VirtualKeys.J;
      case VirtualKeys.V:
        return VirtualKeys.K;
      case VirtualKeys.B:
        return VirtualKeys.X;
      case VirtualKeys.N:
        return VirtualKeys.B;
      case VirtualKeys.M:
        return VirtualKeys.M;
      case VirtualKeys.Comma:
        return VirtualKeys.W;
      case VirtualKeys.Period:
        return VirtualKeys.V;
      case VirtualKeys.Slash:
        return VirtualKeys.Z;
      case VirtualKeys.Backslash:
        return VirtualKeys.BracketLeft;
      case VirtualKeys.Minus:
        return VirtualKeys.BracketRight;
      case VirtualKeys.Equal:
        return VirtualKeys.Backslash;
      default:
        return virtualKey;
    }
  }
}

export class QwertyToColemakKeyboard implements KeyboardLayout<VirtualKey> {
  replaceKey(virtualKey: VirtualKey): VirtualKey {
    switch (virtualKey) {
      case VirtualKeys.Q:
        return VirtualKeys.Q;
      case VirtualKeys.W:
        return VirtualKeys.W;
      case VirtualKeys.E:
        return VirtualKeys.F;
      case VirtualKeys.R:
        return VirtualKeys.P;
      case VirtualKeys.T:
        return VirtualKeys.G;
      case VirtualKeys.Y:
        return VirtualKeys.J;
      case VirtualKeys.U:
        return VirtualKeys.L;
      case VirtualKeys.I:
        return VirtualKeys.U;
      case VirtualKeys.O:
        return VirtualKeys.Y;
      case VirtualKeys.P:
        return VirtualKeys.Semicolon;
      case VirtualKeys.BracketLeft:
        return VirtualKeys.BracketLeft;
      case VirtualKeys.BracketRight:
        return VirtualKeys.BracketRight;
      case VirtualKeys.A:
        return VirtualKeys.A;
      case VirtualKeys.S:
        return VirtualKeys.R;
      case VirtualKeys.D:
        return VirtualKeys.S;
      case VirtualKeys.F:
        return VirtualKeys.T;
      case VirtualKeys.G:
        return VirtualKeys.D;
      case VirtualKeys.H:
        return VirtualKeys.H;
      case VirtualKeys.J:
        return VirtualKeys.N;
      case VirtualKeys.K:
        return VirtualKeys.E;
      case VirtualKeys.L:
        return VirtualKeys.I;
      case VirtualKeys.Semicolon:
        return VirtualKeys.O;
      case VirtualKeys.Quote:
        return VirtualKeys.Quote;
      case VirtualKeys.Z:
        return VirtualKeys.Z;
      case VirtualKeys.X:
        return VirtualKeys.X;
      case VirtualKeys.C:
        return VirtualKeys.C;
      case VirtualKeys.V:
        return VirtualKeys.V;
      case VirtualKeys.B:
        return VirtualKeys.B;
      case VirtualKeys.N:
        return VirtualKeys.K;
      case VirtualKeys.M:
        return VirtualKeys.M;
      case VirtualKeys.Comma:
        return VirtualKeys.Comma;
      case VirtualKeys.Period:
        return VirtualKeys.Period;
      case VirtualKeys.Slash:
        return VirtualKeys.Slash;
      case VirtualKeys.Backslash:
        return VirtualKeys.Backslash;
      case VirtualKeys.Minus:
        return VirtualKeys.Minus;
      case VirtualKeys.Equal:
        return VirtualKeys.Equal;
      default:
        return virtualKey;
    }
  }
}
