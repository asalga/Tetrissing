/*
 * Classes poll keyboard state to get state of keys.
 */
public static class Keyboard{
  
  // All they keys that are currently locked.
  private static boolean[] lockedKeys = new boolean[128];
  
  // Use char since we only need to store 2 states (0, 1)
  private static char[] lockedKeyPresses = new char[128];
  
  // The key states, true if key is down, false if key is up.
  private static boolean[] keys = new boolean[128];
  
  /*
   * The specified keys will stay down even after user releases the key.
   * Once they press that key again, only then will the key state be changed to up(false).
   */
  public static  void lockKeys(int[] keys){
    for(int k : keys){
      lockedKeys[k] = true;
    }
  }
  
  /*
   *
   */
  public static void unlockKeys(int[] keys){
    for(int k : keys){
      lockedKeys[k] = false;
    }
  }
  
  /*
   * Set the state of a key to either down (true) or up (false)
   */
  public static void setKeyDown(int key, boolean state){
    // If the key is locked, and the user just released the key, add to our internal count
    if(lockedKeys[key] && state == false){
      lockedKeyPresses[key]++;
      if(lockedKeyPresses[key] == 2){
          keys[key] = false;
          lockedKeyPresses[key] = 0;
      }
    }
    else{
      keys[key] = state;
    }
  }
  
  /* 
   * Returns true if the specified key is down.
   */
  public static boolean isKeyDown(int key){
    return keys[key];
  }
}

// These are outside of keyboard simply because I don't want to keep
// typing Keyboard.KEY_*
final int KEY_SPACE  = 32;
final int KEY_LEFT   = 37;
final int KEY_UP     = 38;
final int KEY_RIGHT  = 39;
final int KEY_DOWN   = 40;

final int KEY_0 = 48;
final int KEY_1 = 49;
final int KEY_2 = 50;
final int KEY_3 = 51;
final int KEY_4 = 52;
final int KEY_5 = 53;
final int KEY_6 = 54;
final int KEY_7 = 55;
final int KEY_8 = 56;
final int KEY_9 = 57;

final int KEY_A = 65;
final int KEY_B = 66;
final int KEY_C = 67;
final int KEY_D = 68;
final int KEY_E = 69;
final int KEY_F = 70;
final int KEY_G = 71;
final int KEY_H = 72;
final int KEY_I = 73;
final int KEY_J = 74;
final int KEY_K = 75;
final int KEY_L = 76;
final int KEY_M = 77;
final int KEY_N = 78;
final int KEY_O = 79;
final int KEY_P = 80;
final int KEY_Q = 81;
final int KEY_R = 82;
final int KEY_S = 83;
final int KEY_T = 84;
final int KEY_U = 85;
final int KEY_V = 86;
final int KEY_W = 87;
final int KEY_X = 88;
final int KEY_Y = 89;
final int KEY_Z = 90;

// Lowercase
final int KEY_a = 97;
final int KEY_b = 98;
final int KEY_c = 99;
final int KEY_d = 100;
final int KEY_e = 101;
final int KEY_f = 102;
final int KEY_g = 103;
final int KEY_h = 104;
final int KEY_i = 105;
final int KEY_j = 106;
final int KEY_k = 107;
final int KEY_l = 108;
final int KEY_m = 109;
final int KEY_n = 110;
final int KEY_o = 111;
final int KEY_p = 112;
final int KEY_q = 113;
final int KEY_r = 114;
final int KEY_s = 115;
final int KEY_t = 116;
final int KEY_u = 117;
final int KEY_v = 118;
final int KEY_w = 119;
final int KEY_x = 120;
final int KEY_y = 121;
final int KEY_z = 122;
